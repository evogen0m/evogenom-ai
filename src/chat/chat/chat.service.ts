import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { and, desc, eq, not, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat';
import { CognitoService } from 'src/aws/cognito.service';
import { AppConfigType } from 'src/config';
import { chatMessages, chats, users } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { MessageScope } from 'src/db/schema';
import { EvogenomApiClient } from 'src/evogenom-api-client/evogenom-api.client';
import { OpenAiProvider } from 'src/openai/openai';
import {
  ChatEventResponse,
  ChatMessageResponse,
  ChatRequest,
} from '../dto/chat';
import { ChatStateResponse } from '../dto/chat-state.dto';
import { ChatState } from '../enum/chat-state.enum';
import { CancelFollowupTool } from '../tool/cancel-followup.tool';
import { FollowupTool } from '../tool/followup.tool';
import { MemoryTool } from '../tool/memory-tool';
import { OnboardingTool } from '../tool/onboarding.tool';
import { ProfileTool } from '../tool/profile.tool';
import { Tool } from '../tool/tool';
import { PromptService } from './prompt.service';

@Injectable()
export class ChatService implements OnApplicationBootstrap {
  constructor(
    private readonly openai: OpenAiProvider,
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly configService: ConfigService<AppConfigType>,
    private readonly promptService: PromptService,
    private readonly memoryTool: MemoryTool,
    private readonly followupTool: FollowupTool,
    private readonly cancelFollowupTool: CancelFollowupTool,
    private readonly profileTool: ProfileTool,
    private readonly onboardingTool: OnboardingTool,
    private readonly evogenomApiClient: EvogenomApiClient,
    private readonly cognitoService: CognitoService,
  ) {
    this.tools = [
      this.memoryTool,
      this.followupTool,
      this.cancelFollowupTool,
      this.profileTool,
      this.onboardingTool,
    ];
  }

  private readonly tools: Tool[];
  private readonly MAX_TOOL_CALL_DEPTH = 10;
  private readonly MAX_HISTORY_MESSAGES = 30;

  logger = new Logger(ChatService.name);

  async *createChatStream(
    request: ChatRequest,
    userId: string,
    evogenomApiToken: string,
  ): AsyncGenerator<ChatEventResponse> {
    this.logger.log(`Streaming chat for user ${userId}`);

    await this.ensureUserExists(userId);

    const chat = await this.getOrCreateChat(userId);

    const userIsOnboarded = await this.promptService.getIsUserOnboarded(userId);
    const currentAgentScope = userIsOnboarded ? 'COACH' : 'ONBOARDING';

    const client =
      currentAgentScope === 'ONBOARDING'
        ? this.openai.getMiniOpenAiClient({
            sessionId: chat.id,
          })
        : this.openai.getOpenAiClient({
            sessionId: chat.id,
          });

    // 1. Save user message
    const userMessageId = randomUUID();

    await this.saveMessage({
      id: userMessageId,
      content: request.content,
      role: 'user',
      userId,
      chatId: chat.id,
      messageScope: currentAgentScope,
    });
    void this.setChatMessageEmbedding(userMessageId, request.content); // Background embedding for user message

    // 2. Prepare initial messages for OpenAI and count messages
    const messages = await this.getChatHistory(
      userId,
      chat.id,
      currentAgentScope,
    );

    // Get system prompt with context metadata
    const systemPrompt = await this.promptService.getSystemPrompt(
      userId,
      evogenomApiToken,
      chat.id,
    );
    this.logger.debug(systemPrompt);

    // Add system prompt as first message
    const messagesWithSystem: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // 3. Start the recursive processing
    yield* this._processChatTurn(
      messagesWithSystem,
      userId,
      chat.id,
      client,
      0,
      currentAgentScope,
    );

    this.logger.log(`Chat stream completed for user ${userId}`);
  }

  private async *_processChatTurn(
    messages: ChatCompletionMessageParam[],
    userId: string,
    chatId: string,
    client: OpenAI, // Pass client to avoid fetching repeatedly
    toolCallDepth: number,
    currentAgentScope: MessageScope,
  ): AsyncGenerator<ChatEventResponse> {
    this.logger.debug(
      `Processing chat turn for user ${userId}, depth ${toolCallDepth}`,
    );

    // API call for the current turn
    const completion = await client.chat.completions.create({
      model: this.configService.getOrThrow('AZURE_OPENAI_MODEL'),
      messages,
      stream: true,
      tools: this.tools.map((tool) => tool.toolDefinition),
      tool_choice: 'auto',
      temperature: 0.7,
      top_p: 0.5,
    });

    // Process response stream
    const responseMessage: OpenAI.Chat.Completions.ChatCompletionMessage = {
      role: 'assistant',
      content: null,
      refusal: null,
    };
    const toolCalls: ChatCompletionMessageToolCall[] = [];
    const messageId = randomUUID();
    const contentBuffer: string[] = [];

    for await (const chunk of completion) {
      this.processChunk(chunk, responseMessage, toolCalls, contentBuffer);
      const contentChunk = chunk.choices[0]?.delta?.content;
      if (contentChunk) {
        yield {
          id: messageId, // Use the same ID for all chunks of this message
          chunk: contentChunk,
          event: 'chunk',
        };
      }
      // Potentially yield tool call info here if needed for UI in the future
    }
    this.logger.debug(`Stream ended for turn. Tool calls: ${toolCalls.length}`);

    // Handle Tool Calls if any
    if (toolCalls.length > 0) {
      this.logger.debug(
        `Handling ${toolCalls.length} tool calls at depth ${toolCallDepth}`,
      );
      responseMessage.tool_calls = toolCalls; // Add accumulated tool calls

      // Check if tool call depth limit is reached
      if (toolCallDepth >= this.MAX_TOOL_CALL_DEPTH) {
        this.logger.warn(
          `Maximum tool call depth (${this.MAX_TOOL_CALL_DEPTH}) reached for chat ${chatId}. Halting tool execution.`,
        );
        // Save a message indicating the limit was reached
        const limitMessageContent =
          'Maximum tool call depth reached. Cannot continue processing tools.';
        const savedLimitMessage = await this.saveMessage({
          id: messageId, // Use the current turn's message ID
          content: limitMessageContent,
          role: 'assistant',
          userId,
          chatId,
          messageScope: currentAgentScope,
        });
        // Yield a final message event
        yield {
          id: savedLimitMessage.id,
          content: limitMessageContent,
          role: 'assistant',
          event: 'message',
          createdAt: savedLimitMessage.createdAt,
        };
        // Stop this branch of recursion
        return;
      }

      // Save assistant message *with* tool calls, *before* execution
      await this.saveMessage({
        id: messageId, // Use the generated ID for this assistant message
        content: null, // Content is null because there are tool calls
        role: 'assistant',
        userId,
        chatId,
        toolData: { toolCalls },
        messageScope: currentAgentScope,
      });

      // Execute tools and get tool result messages (executeTools saves tool messages internally)
      const toolMessages = await this.executeTools(
        toolCalls,
        userId,
        chatId,
        currentAgentScope,
      );

      // Prepare messages for the *next* turn
      const nextMessages: ChatCompletionMessageParam[] = [
        ...messages,
        responseMessage, // Add assistant's message with tool_calls request
        ...toolMessages, // Add the tool results
      ];

      // Recursively call self with updated messages and incremented depth
      yield* this._processChatTurn(
        nextMessages,
        userId,
        chatId,
        client,
        toolCallDepth + 1, // Increment depth
        currentAgentScope,
      );
    } else {
      // Handle regular response (no tool calls)
      const completedMessage = contentBuffer.join('');
      responseMessage.content = completedMessage; // Assign accumulated content

      this.logger.debug(`No tool calls. Saving final assistant message.`);
      // Save the final assistant message for this turn
      const savedMessage = await this.saveMessage({
        id: messageId, // Use the generated ID
        content: completedMessage,
        role: 'assistant',
        userId,
        chatId,
        messageScope: currentAgentScope,
      });

      // Yield the final message event
      yield {
        id: savedMessage.id,
        content: completedMessage,
        role: 'assistant',
        event: 'message',
        createdAt: savedMessage.createdAt,
      };

      // Trigger background embedding for the final assistant message
      void this.setChatMessageEmbedding(savedMessage.id, completedMessage);
    }
  }

  // Helper to process chunks from OpenAI stream
  private processChunk(
    chunk: ChatCompletionChunk,
    responseMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
    accumulatedToolCalls: ChatCompletionMessageToolCall[],
    contentBuffer: string[],
  ): void {
    const delta = chunk.choices[0]?.delta;
    if (!delta) return;

    if (delta.content) {
      contentBuffer.push(delta.content);
    }

    if (delta.tool_calls) {
      delta.tool_calls.forEach((toolCallDelta) => {
        if (toolCallDelta.index === undefined) return;

        if (!accumulatedToolCalls[toolCallDelta.index]) {
          // Initialize the tool call structure if it doesn't exist
          accumulatedToolCalls[toolCallDelta.index] = {
            id: toolCallDelta.id || '', // Should have ID on first chunk
            type: 'function', // Assuming 'function' type
            function: { name: '', arguments: '' },
          };
        }

        const tc = accumulatedToolCalls[toolCallDelta.index];

        if (toolCallDelta.id) {
          tc.id = toolCallDelta.id;
        }
        if (toolCallDelta.function?.name) {
          tc.function.name = toolCallDelta.function.name;
        }
        if (toolCallDelta.function?.arguments) {
          tc.function.arguments += toolCallDelta.function.arguments; // Append arguments
        }
      });
    }

    // Update the role if provided in the delta (usually first chunk)
    if (delta.role && delta.role !== responseMessage.role) {
      responseMessage.role = delta.role as 'assistant';
    }
  }

  // Helper to execute tools and return tool messages
  private async executeTools(
    toolCalls: ChatCompletionMessageToolCall[],
    userId: string,
    chatId: string,
    currentAgentScope: MessageScope,
  ): Promise<ChatCompletionToolMessageParam[]> {
    const toolMessages: ChatCompletionToolMessageParam[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') continue; // Only support function calls for now

      this.logger.debug(
        `Executing tool: ${toolCall.function.name} with id ${toolCall.id}`,
      );

      const tool = this.tools.find(
        (t) => t.toolDefinition.function.name === toolCall.function.name,
      );

      let result: string;
      if (tool) {
        try {
          result = await tool.execute(userId, {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          });
          this.logger.debug(
            `Tool ${toolCall.function.name} executed successfully.`,
          );
        } catch (error) {
          this.logger.error(
            `Error executing tool ${toolCall.function.name}: ${error}`,
          );
          result = `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
        }
      } else {
        this.logger.warn(`Tool not found: ${toolCall.function.name}`);
        result = `Tool ${toolCall.function.name} not found.`;
      }

      // Save tool result message
      await this.saveMessage({
        id: randomUUID(),
        role: 'tool',
        content: result,
        userId,
        chatId,
        toolData: { toolCallId: toolCall.id, toolName: toolCall.function.name },
        messageScope: currentAgentScope,
      });

      toolMessages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result,
      });
    }
    return toolMessages;
  }

  // Centralized message saving
  @Transactional()
  private async saveMessage(messageData: {
    id: string;
    content: string | null;
    role: ChatCompletionMessageParam['role'] | 'tool'; // Allow 'tool' role
    userId: string;
    chatId: string;
    toolData?: Record<string, any> | null; // Use the new jsonb column type
    name?: string | null; // Optionally store tool name
    messageScope: MessageScope;
  }) {
    const tx = this.txHost.tx;
    // Adapt this insertion based on your actual chatMessages schema
    // Ensure your schema has columns for `role`, `tool_calls` (TEXT/JSON), `tool_call_id` (TEXT)
    const [savedMessage] = await tx
      .insert(chatMessages)
      .values({
        id: messageData.id,
        content: messageData.content ?? '', // Database requires string, not null
        role: messageData.role,
        userId: messageData.userId,
        chatId: messageData.chatId,
        toolData: messageData.toolData,
        messageScope: messageData.messageScope,
        // name: messageData.name, // if storing tool name
      })
      .returning();
    this.logger.debug(
      `Saved ${messageData.role} message ${messageData.id} for chat ${messageData.chatId}`,
    );
    return savedMessage;
  }

  @Transactional()
  async getOrCreateChat(userId: string) {
    const tx = this.txHost.tx;

    const chat = await tx.query.chats.findFirst({
      where: eq(chats.userId, userId),
    });

    if (!chat) {
      return await tx
        .insert(chats)
        .values({
          id: randomUUID(),
          userId,
        })
        .returning()
        .then(([chat]) => chat);
    }

    return chat;
  }

  @Transactional()
  async getMessagesForUi(userId: string): Promise<ChatMessageResponse[]> {
    const tx = this.txHost.tx;

    // Ensure user and chat exist for initial message generation if needed
    await this.ensureUserExists(userId);
    const chat = await this.getOrCreateChat(userId);

    let messages = await tx.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.chatId, chat.id), // Ensure messages are for the user's current chat
        not(eq(chatMessages.role, 'tool')),
        sql`${chatMessages.toolData} IS NULL`,
      ),
      orderBy: [desc(chatMessages.createdAt)], // Fetching in descending order for UI
      // No limit here initially, as we need to check if it's empty
    });

    if (messages.length === 0) {
      this.logger.log(
        `No messages found for user ${userId} in chat ${chat.id}. Generating initial welcome message.`,
      );

      // Get OpenAI client for welcome message generation
      const client = this.openai.getMiniOpenAiClient({
        sessionId: chat.id, // Use chat.id as sessionID
      });
      const welcomeMessage = await this._generateAndSaveWelcomeMessage(
        userId,
        chat.id,
        client,
      );
      if (welcomeMessage) {
        messages = [welcomeMessage];
      }
    }

    // Map all messages (original or the newly created welcome message) to response DTO
    // Messages are already sorted by createdAt desc from the initial query or are a single new message.
    return messages
      .map((message) => ChatMessageResponse.fromDb(message))
      .reverse(); // Reverse for UI (oldest first)
  }

  @Transactional()
  async ensureUserExists(userId: string) {
    const tx = this.txHost.tx;
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      await tx.insert(users).values({ id: userId }).returning();
    }
  }

  @Transactional()
  private async getChatHistory(
    userId: string,
    chatId: string,
    agentScope: MessageScope,
  ): Promise<ChatCompletionMessageParam[]> {
    const tx = this.txHost.tx;
    // Fetch more messages if needed, potentially limited by token count later
    const dbMessages = await tx.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.chatId, chatId),
        eq(chatMessages.messageScope, agentScope),
      ),
      orderBy: [desc(chatMessages.createdAt)],
      limit: this.MAX_HISTORY_MESSAGES,
    });

    // Reverse the order of messages to get the most recent messages first
    dbMessages.reverse();

    // Map DB messages to OpenAI format
    const history: ChatCompletionMessageParam[] = [];
    for (const message of dbMessages) {
      switch (message.role) {
        case 'user': {
          // Add timestamp as system message before each user message
          const timestamp = new Date(message.createdAt).toISOString();
          history.push({
            role: 'system',
            content: `Timestamp: ${timestamp}`,
          });

          history.push({
            role: 'user',
            content: message.content,
          } as ChatCompletionUserMessageParam);
          break;
        }
        case 'assistant': {
          // Need to handle potential tool_calls stored in the DB message
          const toolData = message.toolData as {
            toolCalls?: ChatCompletionMessageToolCall[];
          } | null;
          const toolCalls = toolData?.toolCalls
            ? toolData.toolCalls
            : undefined;
          history.push({
            role: 'assistant',
            content: message.content, // Might be null if tool_calls is present
            tool_calls: toolCalls,
          } as ChatCompletionAssistantMessageParam);
          break;
        }
        case 'tool': {
          // Extract tool_call_id from the toolData field
          const toolData = message.toolData as { toolCallId?: string } | null;
          const toolCallId = toolData?.toolCallId;
          if (!toolCallId) {
            const errorMessage = `Tool message ${message.id} is missing toolCallId in toolData`;
            this.logger.error(errorMessage);
            // Handle error case appropriately, maybe skip or throw
            throw new Error(errorMessage);
          }
          history.push({
            role: 'tool',
            content: message.content ?? '', // Ensure content is string
            tool_call_id: toolCallId,
          } as ChatCompletionToolMessageParam);
          break; // Add break statement
        }
        default: {
          // Handle unrecognized roles if necessary
          this.logger.error(`Unknown message role in history: ${message.role}`);
          throw new Error(`Unknown message role: ${message.role}`);
        }
      }
    }
    return history;
  }

  async setChatMessageEmbedding(messageId: string, text: string) {
    if (!text || text.trim().length === 0) {
      this.logger.debug(`Skipping embedding for empty message ${messageId}`);
      return; // Don't attempt to embed empty strings
    }

    try {
      await this.txHost.withTransaction(async () => {
        // Get the chatId for this message
        const message = await this.txHost.tx
          .select({ chatId: chatMessages.chatId })
          .from(chatMessages)
          .where(eq(chatMessages.id, messageId))
          .limit(1);

        if (!message || message.length === 0) {
          this.logger.warn(
            `Message ${messageId} not found when setting embedding`,
          );
          return;
        }

        const chatId = message[0].chatId;
        const embedding = await this.openai.generateEmbedding(text, chatId);
        const [res] = await this.txHost.tx
          .update(chatMessages)
          .set({ embedding })
          .where(eq(chatMessages.id, messageId))
          .returning({ id: chatMessages.id });

        if (res) {
          this.logger.debug(`Embedding updated for message ${res.id}`);
        } else {
          this.logger.warn(
            `Failed to find message ${messageId} to update embedding.`,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to set embedding for message ${messageId}: ${error}`,
      );
    }
  }

  async onApplicationBootstrap() {
    // Initialize embedding for messages that don't have embedding
    this.logger.log('Checking for chat messages without embeddings...');

    const messagesWithoutEmbedding = await this.txHost.tx
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        chatId: chatMessages.chatId,
      })
      .from(chatMessages)
      .where(
        sql`${chatMessages.embedding} IS NULL AND ${chatMessages.content} IS NOT NULL AND LENGTH(${chatMessages.content}) > 0`,
      );

    this.logger.log(
      `Found ${messagesWithoutEmbedding.length} messages without embeddings`,
    );

    // Process each message one by one, ensuring we wait for each embedding to complete
    for (const message of messagesWithoutEmbedding) {
      try {
        await this.setChatMessageEmbedding(message.id, message.content);
        this.logger.debug(`Added embedding for message ${message.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to add embedding for message ${message.id}: ${error}`,
        );
      }
    }
  }

  /**
   * Creates an assistant message in the chat history
   * @param userId The user ID
   * @param content The content of the message
   * @returns The created message
   */
  @Transactional()
  async createAssistantMessage(userId: string, content: string) {
    const chat = await this.getOrCreateChat(userId);
    const messageId = randomUUID();

    const user = await this.txHost.tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { isOnboarded: true },
    });
    const messageScopeForAssistant = user?.isOnboarded ? 'COACH' : 'ONBOARDING';

    const savedMessage = await this.saveMessage({
      id: messageId,
      content,
      role: 'assistant',
      userId,
      chatId: chat.id,
      messageScope: messageScopeForAssistant,
    });

    // Trigger embedding generation in the background
    void this.setChatMessageEmbedding(messageId, content);

    return savedMessage;
  }

  /**
   * Get the chat state for a user
   * @param userId The user ID
   * @param evogenomApiToken The API token for Evogenom API
   * @returns The chat state
   */
  @Transactional()
  async getChatState(
    userId: string,
    evogenomApiToken: string,
  ): Promise<ChatStateResponse> {
    const tx = this.txHost.tx;

    try {
      // Ensure the user exists
      await this.ensureUserExists(userId);

      // Get the user to check if they're onboarded
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          isOnboarded: true,
        },
      });

      // Check if the user has made any purchases
      const userOrders = await this.evogenomApiClient.getUserOrders(
        userId,
        evogenomApiToken,
      );
      const hasPurchase = userOrders.length > 0;

      // Determine chat state based on purchase and onboarding status
      let chatState: ChatState;

      if (!hasPurchase) {
        // User has not made a purchase
        chatState = ChatState.NOT_ALLOWED;
      } else if (!user?.isOnboarded) {
        // User has made a purchase but not completed onboarding
        chatState = ChatState.NEW_USER;
      } else {
        // User has made a purchase and completed onboarding
        chatState = ChatState.ALLOWED;
      }

      return { state: chatState };
    } catch (error) {
      this.logger.error(
        `Failed to get chat state for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get chat state: ${error.message}`);
    }
  }

  // New private helper method for generating welcome message
  private async _generateAndSaveWelcomeMessage(
    userId: string,
    chatId: string,
    client: OpenAI, // Pass the client to reuse it
  ): Promise<typeof chatMessages.$inferSelect | null> {
    this.logger.log(
      `Generating initial welcome message for user ${userId}, chat ${chatId}.`,
    );

    // 1. Get the system prompt for the welcome message
    const welcomeSystemPrompt =
      await this.promptService.getInitialWelcomeSystemPrompt(userId);
    this.logger.debug(`Welcome system prompt: ${welcomeSystemPrompt}`);

    try {
      // 2. Make a non-streaming call to OpenAI to generate the welcome message
      const completion = await client.chat.completions.create({
        model: this.configService.getOrThrow('AZURE_OPENAI_MODEL'),
        messages: [{ role: 'system', content: welcomeSystemPrompt }],
        temperature: 0.7,
      });

      const assistantResponse = completion.choices[0]?.message?.content;

      if (assistantResponse) {
        const messageId = randomUUID();
        const userIsOnboarded =
          await this.promptService.getIsUserOnboarded(userId);
        const messageScopeForWelcome = userIsOnboarded ? 'COACH' : 'ONBOARDING';

        const savedWelcomeMessage = await this.saveMessage({
          id: messageId,
          content: assistantResponse,
          role: 'assistant',
          userId,
          chatId: chatId,
          messageScope: messageScopeForWelcome,
        });
        this.logger.log(
          `Saved initial welcome message ${messageId} for user ${userId}`,
        );
        void this.setChatMessageEmbedding(messageId, assistantResponse); // Background embedding
        return savedWelcomeMessage;
      } else {
        this.logger.error(
          `LLM failed to generate content for initial welcome message for user ${userId}.`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Error generating initial welcome message for user ${userId}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
