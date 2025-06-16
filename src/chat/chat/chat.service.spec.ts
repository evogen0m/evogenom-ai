/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { CognitoService } from 'src/aws/cognito.service';
import { ContentfulApiClient } from 'src/contentful/contentful-api-client';
import { chatMessages, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { quickResponses } from 'src/db/schema';
import { EvogenomApiClient } from 'src/evogenom-api-client/evogenom-api.client';
import { createTestingModuleWithDb } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAiProvider } from '../../openai/openai';
import { ChatEventResponse, ChatRequest } from '../dto/chat';
import { ChatState } from '../enum/chat-state.enum';
import { CancelFollowupTool } from '../tool/cancel-followup.tool';
import { EditWellnessPlanTool } from '../tool/edit-wellness-plan.tool';
import { FollowupTool } from '../tool/followup.tool';
import { MemoryTool } from '../tool/memory-tool';
import { OnboardingTool } from '../tool/onboarding.tool';
import { ProfileTool } from '../tool/profile.tool';
import { Tool } from '../tool/tool';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';

describe('ChatService', () => {
  let service: ChatService;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;
  let mockEvogenomApiClient: EvogenomApiClient;
  let mockPromptService: PromptService;
  let mockCognitoService: CognitoService;

  const mockOpenAiClient = {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    },
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a 1536-dimensional embedding array for testing
    const mockEmbedding = Array(1536)
      .fill(0)
      .map((_, i) => (i % 10) * 0.1);
    // Set up OpenAI mock
    openAiProvider = {
      createChatCompletion: vi.fn().mockImplementation(async (params) => {
        const {
          stream,
          messages,
          tools,
          toolChoice,
          temperature,
          topP,
          maxTokens,
          responseFormat,
        } = params;

        if (stream) {
          // Pass all the parameters to the mock OpenAI client
          return mockOpenAiClient.chat.completions.create({
            stream: true,
            messages,
            model: 'mock-model',
            ...(tools && { tools }),
            ...(toolChoice && { tool_choice: toolChoice }),
            ...(temperature !== undefined && { temperature }),
            ...(topP !== undefined && { top_p: topP }),
            ...(maxTokens !== undefined && { max_tokens: maxTokens }),
            ...(responseFormat && { response_format: responseFormat }),
          });
        } else {
          // Pass all the parameters to the mock OpenAI client
          return mockOpenAiClient.chat.completions.create({
            stream: false,
            messages,
            model: 'mock-model',
            ...(tools && { tools }),
            ...(toolChoice && { tool_choice: toolChoice }),
            ...(temperature !== undefined && { temperature }),
            ...(topP !== undefined && { top_p: topP }),
            ...(maxTokens !== undefined && { max_tokens: maxTokens }),
            ...(responseFormat && { response_format: responseFormat }),
          });
        }
      }),
      generateEmbedding: vi.fn().mockResolvedValue(mockEmbedding),
    } as unknown as OpenAiProvider;

    mockPromptService = {
      getSystemPrompt: vi.fn().mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (userId: string, token: string, chatId: string) => {
          return 'mock system prompt';
        },
      ),
      getIsUserOnboarded: vi.fn().mockResolvedValue(true),
      getInitialWelcomeSystemPrompt: vi
        .fn()
        .mockResolvedValue('mock welcome prompt'),
      evogenomApiClient: {} as EvogenomApiClient,
      contentfulApiClient: {} as ContentfulApiClient,
      txHost: {} as any,
      cognitoService: {} as CognitoService,
      getUserTimeZone: vi.fn().mockResolvedValue('UTC'),
      getUserProfile: vi.fn().mockResolvedValue(null),
      getTotalMessageCount: vi.fn().mockResolvedValue(0),
      getCurrentMessageCount: vi.fn().mockResolvedValue(0),
      getPendingFollowups: vi.fn().mockResolvedValue([]),
      getResultRowsByProductCode: vi.fn().mockResolvedValue({}),
      getProductByProductCode: vi.fn().mockResolvedValue({}),
      formatSystemPrompt: vi
        .fn()
        .mockReturnValue('formatted mock system prompt'),
      formatUserProfileInfo: vi.fn().mockReturnValue(''),
      getQuickResponseSystemPrompt: vi.fn(),
    } as unknown as PromptService;

    const mockConfigService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === 'AZURE_OPENAI_MODEL') return 'mock-model';
        if (key === 'AZURE_OPENAI_MODEL_MINI') return 'mock-model-mini';
        if (key === 'AZURE_OPENAI_EMBEDDING_MODEL')
          return 'text-embedding-3-small';
        return 'mock-value';
      }),
    };

    const mockToolDefinition = {
      type: 'function',
      function: {
        name: 'memory',
        description: 'A tool for memory',
        parameters: {
          type: 'object',
        },
      },
    };

    const mockMemoryTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockToolDefinition as any,
    });

    const mockFollowupToolDefinition = {
      type: 'function',
      function: {
        name: 'create_followup',
        description: 'Create a follow-up reminder',
        parameters: {
          type: 'object',
        },
      },
    };

    const mockFollowupTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockFollowupToolDefinition as any,
    });

    const mockCancelFollowupToolDefinition = {
      type: 'function',
      function: {
        name: 'cancel_followup',
        description: 'Cancel an existing follow-up reminder',
        parameters: {
          type: 'object',
        },
      },
    };

    const mockCancelFollowupTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockCancelFollowupToolDefinition as any,
    });

    const mockOnboardingToolDefinition = {
      type: 'function',
      function: {
        name: 'completeOnboarding',
        description: 'Mark user onboarding as complete',
        parameters: { type: 'object' },
      },
    };

    const mockOnboardingTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockOnboardingToolDefinition as any,
    });

    const mockProfileToolDefinition = {
      type: 'function',
      function: {
        name: 'updateUserProfile',
        description: 'Update user profile fields',
        parameters: { type: 'object' },
      },
    };

    const mockProfileTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockProfileToolDefinition as any,
    });

    const mockEditWellnessPlanToolDefinition = {
      type: 'function',
      function: {
        name: 'edit_wellness_plan',
        description: "Edits the user's wellness plan",
        parameters: { type: 'object' },
      },
    };

    const mockEditWellnessPlanTool: Tool = vi.mocked({
      execute: vi.fn(),
      canExecute: vi.fn(),
      toolDefinition: mockEditWellnessPlanToolDefinition as any,
    });

    // Added CognitoService mock
    mockCognitoService = {
      getUserLanguage: vi.fn().mockResolvedValue('en'),
      getUserDeviceToken: vi.fn().mockResolvedValue('mock-device-token'),
      getUserAttribute: vi.fn().mockResolvedValue(null), // generic mock for other attributes
    } as unknown as CognitoService;

    const moduleBuilder = createTestingModuleWithDb({
      providers: [
        ChatService,
        {
          provide: OpenAiProvider,
          useValue: openAiProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PromptService,
          useValue: mockPromptService,
        },
        { provide: MemoryTool, useValue: mockMemoryTool },
        { provide: FollowupTool, useValue: mockFollowupTool },
        { provide: CancelFollowupTool, useValue: mockCancelFollowupTool },
        { provide: OnboardingTool, useValue: mockOnboardingTool },
        { provide: ProfileTool, useValue: mockProfileTool },
        {
          provide: EditWellnessPlanTool,
          useValue: mockEditWellnessPlanTool,
        },
        {
          provide: EvogenomApiClient,
          useValue: {
            getUserOrders: vi.fn(),
          },
        },
        {
          provide: CognitoService,
          useValue: mockCognitoService,
        },
      ],
    });

    const module = await moduleBuilder.compile(); // Compile the module

    service = module.get<ChatService>(ChatService);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);
    mockEvogenomApiClient = module.get<EvogenomApiClient>(EvogenomApiClient);

    // Clear test database tables before each test
    // await dbClient.execute(sql`TRUNCATE TABLE chat_messages CASCADE`);
    // await dbClient.execute(sql`TRUNCATE TABLE chats CASCADE`);
    // await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  // Add afterEach to clean up the database
  afterEach(async () => {
    await dbClient.execute(sql`TRUNCATE TABLE chat_message CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE quick_response CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE chat CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureUserExists', () => {
    it('should create a user if it does not exist', async () => {
      // Execute
      const userId = randomUUID();
      await service.ensureUserExists(userId);

      // Verify
      const createdUser = await dbClient.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      expect(createdUser).toBeDefined();
      expect(createdUser?.id).toEqual(userId);
    });

    it('should not create a duplicate user if it already exists', async () => {
      // Setup
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      // Execute
      await service.ensureUserExists(userId);

      // Verify - should still have only one user
      const userCount = await dbClient
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`id = ${userId}`);
      expect(Number(userCount[0].count)).toEqual(1);
    });
  });

  describe('getOrCreateChat', () => {
    it('should create a new chat for a user', async () => {
      // Setup - insert user first
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      // Execute
      const chat = await service.getOrCreateChat(userId);

      // Verify
      expect(chat.userId).toEqual(userId);
      const createdChat = await dbClient.query.chats.findFirst({
        where: (chats, { eq }) => eq(chats.userId, userId),
      });
      expect(createdChat).toBeDefined();
      expect(createdChat?.id).toEqual(chat.id);
    });

    it('should return existing chat if one exists', async () => {
      // Setup
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      const chatId = randomUUID();
      const existingChat = await dbClient
        .insert(chats)
        .values({ id: chatId, userId })
        .returning()
        .then((rows) => rows[0]);

      // Execute
      const chat = await service.getOrCreateChat(userId);

      // Verify
      expect(chat.id).toEqual(existingChat.id);
      expect(chat.userId).toEqual(userId);
    });
  });

  describe('getMessages', () => {
    it('should return messages for a user, excluding tool messages, respecting default pagination', async () => {
      // Setup
      const userId = randomUUID();
      const chatId = randomUUID();

      // Insert user and chat
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Insert messages including a tool message that should be filtered out
      // Insert more than default pageSize (100 based on service change) to test pagination
      const totalMessages = 105;
      for (let i = 0; i < totalMessages; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          role: i % 3 === 0 ? 'user' : 'assistant', // Mix of user and assistant
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - (totalMessages - i) * 1000), // Ensure order
          userId,
          chatId,
          messageScope: 'COACH',
          toolData: null,
          embedding: null,
        });
      }
      // Add one tool message
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'tool',
        content: 'Tool response',
        createdAt: new Date(Date.now() - 500),
        userId,
        chatId,
        toolData: { toolCallId: 'test-id' },
        messageScope: 'COACH',
        embedding: null,
      });

      // Execute with default pagination
      const result = await service.getMessagesForUi(userId);

      // Verify
      expect(result.items.length).toEqual(100); // Default pageSize is 100 after user's change
      expect(result.total).toEqual(totalMessages);
      expect(result.page).toEqual(0);
      expect(result.pageSize).toEqual(100);

      // The result.items are ordered by createdAt DESC (newest first)
      expect(result.items[0].content).toEqual(`Message ${totalMessages - 1}`); // Newest non-tool message
      expect(result.items[99].content).toEqual(
        `Message ${totalMessages - 100}`,
      );

      // All messages should be either 'user' or 'assistant' (no 'tool' messages)
      expect(
        result.items.every(
          (msg) => msg.role === 'user' || msg.role === 'assistant',
        ),
      ).toBe(true);
    });

    it('should return a generated welcome message when no messages exist and on page 0', async () => {
      // Setup
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      // Mock the OpenAI call for the welcome message
      const mockWelcomeContent = 'Welcome to our service!';
      mockOpenAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: mockWelcomeContent } }],
      });

      // Execute with default pagination (page 0)
      const result = await service.getMessagesForUi(userId);

      // Verify
      expect(result.items.length).toEqual(1);
      expect(result.total).toEqual(1);
      expect(result.page).toEqual(0);
      expect(result.items[0].role).toEqual('assistant');
      expect(result.items[0].content).toEqual(mockWelcomeContent);

      // Verify PromptService was called for the welcome prompt
      expect(
        mockPromptService.getInitialWelcomeSystemPrompt,
      ).toHaveBeenCalledWith(userId);

      // Verify OpenAI was called with the welcome prompt
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'system', content: 'mock welcome prompt' }],
        }),
      );

      // Verify the welcome message was saved to the database
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });
      expect(savedMessages.length).toEqual(1);
      expect(savedMessages[0].role).toEqual('assistant');
      expect(savedMessages[0].content).toEqual(mockWelcomeContent);
    });

    it('should return empty items if requesting a page beyond total messages and no welcome message applicable', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'A single message',
        userId,
        chatId,
        messageScope: 'COACH',
      });

      const result = await service.getMessagesForUi(userId, 1, 10); // Request page 1 (second page)

      expect(result.items.length).toEqual(0);
      expect(result.total).toEqual(1);
      expect(result.page).toEqual(1);
      expect(result.pageSize).toEqual(10);
    });

    it('should respect custom page and pageSize parameters', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const totalMessages = 25;
      for (let i = 0; i < totalMessages; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          role: 'user',
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - (totalMessages - i) * 1000),
          userId,
          chatId,
          messageScope: 'COACH',
        });
      }

      const page = 1;
      const pageSize = 5;
      const result = await service.getMessagesForUi(userId, page, pageSize);

      expect(result.items.length).toEqual(pageSize);
      expect(result.total).toEqual(totalMessages);
      expect(result.page).toEqual(page);
      expect(result.pageSize).toEqual(pageSize);
      // Messages are 0-indexed. Newest is Message 24.
      // Page 0, pageSize 5: Messages 24, 23, 22, 21, 20
      // Page 1, pageSize 5: Messages 19, 18, 17, 16, 15
      expect(result.items[0].content).toEqual('Message 19'); // (total - 1) - (page * pageSize)
      expect(result.items[4].content).toEqual('Message 15'); // (total - 1) - (page * pageSize) - (pageSize - 1)
    });

    it('should return the last partial page correctly', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const totalMessages = 23; // Not an even multiple of pageSize
      for (let i = 0; i < totalMessages; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          role: 'user',
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - (totalMessages - i) * 1000),
          userId,
          chatId,
          messageScope: 'COACH',
        });
      }

      const pageSize = 10;
      const page = 2; // page 0: 10 msgs, page 1: 10 msgs, page 2: 3 msgs
      const result = await service.getMessagesForUi(userId, page, pageSize);

      expect(result.items.length).toEqual(3); // Remaining messages
      expect(result.total).toEqual(totalMessages);
      expect(result.page).toEqual(page);
      expect(result.pageSize).toEqual(pageSize);
      // Newest is Message 22
      // Page 0: Msgs 22..13
      // Page 1: Msgs 12..3
      // Page 2: Msgs 2, 1, 0
      expect(result.items[0].content).toEqual('Message 2');
      expect(result.items[2].content).toEqual('Message 0');
    });

    it('should not generate welcome message if on page > 0, even if total messages are 0 (which should not happen if page > 0)', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      // Mock OpenAI to check if it's called
      mockOpenAiClient.chat.completions.create.mockClear();

      // Request page 1, pageSize 10. No messages exist.
      const result = await service.getMessagesForUi(userId, 1, 10);

      expect(result.items.length).toEqual(0);
      expect(result.total).toEqual(0);
      expect(result.page).toEqual(1);
      expect(result.pageSize).toEqual(10);
      expect(mockOpenAiClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should use default pageSize of 100 if pageSize is not provided', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const totalMessages = 105;
      for (let i = 0; i < totalMessages; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          role: 'user',
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - (totalMessages - i) * 1000),
          userId,
          chatId,
          messageScope: 'COACH',
        });
      }

      // Call with page 0, but no pageSize (should default to 100 in service)
      const result = await service.getMessagesForUi(userId, 0);

      expect(result.items.length).toEqual(100);
      expect(result.total).toEqual(totalMessages);
      expect(result.page).toEqual(0);
      expect(result.pageSize).toEqual(100);
      expect(result.items[0].content).toEqual(`Message ${totalMessages - 1}`);
      expect(result.items[99].content).toEqual(
        `Message ${totalMessages - 100}`,
      );
    });

    it('should use default page of 0 if page is not provided', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const totalMessages = 15;
      for (let i = 0; i < totalMessages; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          role: 'user',
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - (totalMessages - i) * 1000),
          userId,
          chatId,
          messageScope: 'COACH',
        });
      }

      // Call with pageSize, but no page (should default to 0 in service)
      const result = await service.getMessagesForUi(userId, undefined, 5);

      expect(result.items.length).toEqual(5);
      expect(result.total).toEqual(totalMessages);
      expect(result.page).toEqual(0);
      expect(result.pageSize).toEqual(5);
      expect(result.items[0].content).toEqual('Message 14');
      expect(result.items[4].content).toEqual('Message 10');
    });
  });

  describe('createAssistantMessage', () => {
    it('should create an assistant message in chat history', async () => {
      // Setup
      const userId = randomUUID();
      const content = 'This is a follow-up notification message';

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Spy on setChatMessageEmbedding to verify it's called
      const setChatMessageEmbeddingSpy = vi.spyOn(
        service,
        'setChatMessageEmbedding',
      );

      // Execute
      const savedMessage = await service.createAssistantMessage(
        userId,
        content,
      );

      // Verify
      expect(savedMessage).toBeDefined();
      expect(savedMessage.role).toEqual('assistant');
      expect(savedMessage.content).toEqual(content);
      expect(savedMessage.userId).toEqual(userId);

      // Verify chat was created
      const chat = await dbClient.query.chats.findFirst({
        where: (chats, { eq }) => eq(chats.userId, userId),
      });
      expect(chat).toBeDefined();
      expect(savedMessage.chatId).toEqual(chat!.id);

      // Verify message exists in database
      const dbMessage = await dbClient.query.chatMessages.findFirst({
        where: (messages, { eq }) => eq(messages.id, savedMessage.id),
      });
      expect(dbMessage).toBeDefined();
      expect(dbMessage!.role).toEqual('assistant');
      expect(dbMessage!.content).toEqual(content);

      // Verify embedding was triggered
      expect(setChatMessageEmbeddingSpy).toHaveBeenCalledWith(
        savedMessage.id,
        content,
      );
    });

    it('should use existing chat if one exists', async () => {
      // Setup
      const userId = randomUUID();
      const content = 'Assistant message using existing chat';

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Create a chat first
      const existingChat = await service.getOrCreateChat(userId);

      // Execute
      const savedMessage = await service.createAssistantMessage(
        userId,
        content,
      );

      // Verify message uses existing chat
      expect(savedMessage.chatId).toEqual(existingChat.id);
    });
  });

  describe('createChatStream', () => {
    it('should stream chat responses and save messages', async () => {
      // Setup
      const userId = randomUUID();
      const streamingResponse = [
        { id: 'chunk1', choices: [{ delta: { content: 'Hello' } }] },
        { id: 'chunk2', choices: [{ delta: { content: ' world' } }] },
        { id: 'chunk3', choices: [{ delta: { content: '!' } }] },
      ];

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Configure mocks for this test
      // The createChatCompletion mock is already set up in beforeEach

      // Mock the streaming behavior
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamingResponse) {
            yield chunk;
          }
        },
      } as any);

      // Create the chat request
      const request: ChatRequest = { content: 'Hi there' };

      await service.getOrCreateChat(userId); // Ensures chat.id is available for getSystemPrompt

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the stream events
      expect(events.length).toEqual(4); // 3 chunks + 1 final message

      // Check chunks
      expect(events[0].event).toEqual('chunk');
      expect((events[0] as any).chunk).toEqual('Hello');
      expect(events[1].event).toEqual('chunk');
      expect((events[1] as any).chunk).toEqual(' world');
      expect(events[2].event).toEqual('chunk');
      expect((events[2] as any).chunk).toEqual('!');

      // Check final message
      expect(events[3].event).toEqual('message');
      expect((events[3] as any).content).toEqual('Hello world!');
      expect((events[3] as any).role).toEqual('assistant');

      // Verify message was saved to the database
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });
      expect(savedMessages.length).toEqual(2); // One user message and one assistant message
      expect(
        savedMessages.some(
          (m) => m.role === 'user' && m.content === 'Hi there',
        ),
      ).toBeTruthy();
      expect(
        savedMessages.some(
          (m) => m.role === 'assistant' && m.content === 'Hello world!',
        ),
      ).toBeTruthy();
    });

    it('should handle empty chunks correctly', async () => {
      // Setup
      const userId = randomUUID();
      const streamingResponse = [
        { id: 'chunk1', choices: [{ delta: {} }] },
        { id: 'chunk2', choices: [{ delta: { content: 'Hello' } }] },
        { id: 'chunk3', choices: [{ delta: {} }] },
      ];

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Configure mocks for this test
      // The createChatCompletion mock is already set up in beforeEach

      // Mock the streaming behavior
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamingResponse) {
            yield chunk;
          }
        },
      } as any);

      // Create the chat request
      const request: ChatRequest = { content: 'Hi there' };

      await service.getOrCreateChat(userId); // Ensures chat.id is available for getSystemPrompt

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the stream events - should only have the Hello chunk and final message
      expect(events.length).toEqual(2);
      expect(events[0].event).toEqual('chunk');
      expect((events[0] as any).chunk).toEqual('Hello');
      expect(events[1].event).toEqual('message');

      // Verify messages saved to database
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });
      expect(savedMessages.length).toEqual(2); // One user message and one assistant message
    });

    it('should handle tool calls and execute them', async () => {
      // Setup
      const userId = randomUUID();
      const chatId = randomUUID();
      const toolCallId = 'tool-call-123';

      // Insert user and chat
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Mock tool execution
      const mockToolResult = 'This is the memory tool result';
      const mockMemoryTool = service['tools'][0];
      (mockMemoryTool.execute as any).mockResolvedValue(mockToolResult);

      // Setup first streaming response with tool calls
      const firstStreamResponse = [
        {
          id: 'chunk1',
          choices: [
            {
              delta: {
                role: 'assistant',
                tool_calls: [
                  {
                    index: 0,
                    id: toolCallId,
                    function: { name: 'memory' },
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'chunk2',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { arguments: '{"query":"' },
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'chunk3',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { arguments: 'test query"}' },
                  },
                ],
              },
            },
          ],
        },
      ];

      // Setup second streaming response after tool execution
      const secondStreamResponse = [
        {
          id: 'chunk4',
          choices: [{ delta: { content: 'Based on my memory: ' } }],
        },
        { id: 'chunk5', choices: [{ delta: { content: mockToolResult } }] },
      ];

      // Mock the streaming behavior to first return tool calls, then regular content
      mockOpenAiClient.chat.completions.create.mockImplementation((params) => {
        // Check if this is the second call (after tool execution)
        const isSecondCall = params.messages.some(
          (msg) =>
            msg.role === 'tool' &&
            'tool_call_id' in msg &&
            msg.tool_call_id === toolCallId,
        );

        if (isSecondCall) {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of secondStreamResponse) {
                yield chunk;
              }
            },
          } as any;
        } else {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of firstStreamResponse) {
                yield chunk;
              }
            },
          } as any;
        }
      });

      // Create the chat request
      const request: ChatRequest = { content: 'Use memory to find info' };

      // Note: service.getOrCreateChat(userId) is NOT called here because
      // this test explicitly sets up a chat with `chatId` above,
      // and we want to ensure the system prompt is fetched for *that* specific chat.
      // The `createChatStream` will internally call `getOrCreateChat`,
      // which will return the chat created above.

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the streaming events
      // We should have received the chunks from the second response and a final message
      expect(
        events.some(
          (e) =>
            e.event === 'chunk' && (e as any).chunk === 'Based on my memory: ',
        ),
      ).toBeTruthy();
      expect(
        events.some(
          (e) => e.event === 'chunk' && (e as any).chunk === mockToolResult,
        ),
      ).toBeTruthy();
      expect(events.some((e) => e.event === 'message')).toBeTruthy();

      // Verify the final message content contains the tool result
      const finalMessage = events.find((e) => e.event === 'message');
      expect((finalMessage as any).content).toContain(mockToolResult);

      // Verify that the memory tool was called
      expect(mockMemoryTool.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'memory',
          arguments: '{"query":"test query"}',
        }),
      );

      // Verify messages in the database - should have user, assistant (with tool calls), tool, and final assistant
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });

      expect(savedMessages.length).toEqual(4);

      // Check user message
      expect(
        savedMessages.some(
          (m) => m.role === 'user' && m.content === 'Use memory to find info',
        ),
      ).toBeTruthy();

      // Check assistant message with tool calls
      const assistantWithToolCalls = savedMessages.find(
        (m) =>
          m.role === 'assistant' && m.content === '' && m.toolData !== null,
      );
      expect(assistantWithToolCalls).toBeDefined();
      expect(assistantWithToolCalls?.toolData).toBeDefined();

      // Check tool message
      const toolMessage = savedMessages.find(
        (m) => m.role === 'tool' && m.content === mockToolResult,
      );
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.toolData).toEqual(
        expect.objectContaining({
          toolCallId: toolCallId,
          toolName: 'memory',
        }),
      );

      // Check final assistant message
      expect(
        savedMessages.some(
          (m) => m.role === 'assistant' && m.content.includes(mockToolResult),
        ),
      ).toBeTruthy();
    });

    it('should handle the maximum tool call depth and stop recursion', async () => {
      // Setup
      const userId = randomUUID();
      const MAX_DEPTH = service['MAX_TOOL_CALL_DEPTH'];

      // Set up OpenAI mock to always return tool calls
      const toolCallStream = [
        {
          id: 'tool-chunk',
          choices: [
            {
              delta: {
                role: 'assistant',
                tool_calls: [
                  {
                    index: 0,
                    id: `tool-call-${randomUUID()}`,
                    function: {
                      name: 'memory',
                      arguments: '{"query":"test"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of toolCallStream) {
            yield chunk;
          }
        },
      } as any);

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Mock tool execution
      const mockMemoryTool = service['tools'][0];
      (mockMemoryTool.execute as any).mockResolvedValue('Test result');

      // Create chat request
      const request: ChatRequest = {
        content: 'This will recursively call tools',
      };

      await service.getOrCreateChat(userId); // Ensures chat.id is available for getSystemPrompt

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the max tool call count
      // The test should have stopped at MAX_TOOL_CALL_DEPTH
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledTimes(
        MAX_DEPTH + 1,
      );

      // Verify the final message mentions reaching the limit
      const finalMessage = events.find((e) => e.event === 'message');
      expect((finalMessage as any).content).toContain(
        'Maximum tool call depth reached',
      );

      // Check all the messages were saved
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });

      // Should have 1 user message + MAX_DEPTH pairs of (assistant with tool call + tool message) + 1 final message
      const expectedCount = 1 + MAX_DEPTH * 2 + 1;
      expect(savedMessages.length).toEqual(expectedCount);
    });

    it('should handle multiple tool calls in a single response', async () => {
      // Setup
      const userId = randomUUID();
      const toolCall1Id = 'tool-call-1';
      const toolCall2Id = 'tool-call-2';

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Mock tool execution
      const mockMemoryTool = service['tools'][0];
      (mockMemoryTool.execute as any)
        .mockResolvedValueOnce('First tool result')
        .mockResolvedValueOnce('Second tool result');

      // Setup response with multiple tool calls
      const multiToolCallStream = [
        {
          id: 'chunk1',
          choices: [
            {
              delta: {
                role: 'assistant',
                tool_calls: [
                  {
                    index: 0,
                    id: toolCall1Id,
                    function: { name: 'memory' },
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'chunk2',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { arguments: '{"query":"first query"}' },
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'chunk3',
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 1,
                    id: toolCall2Id,
                    function: {
                      name: 'memory',
                      arguments: '{"query":"second query"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      // Final response after tool executions
      const finalResponseStream = [
        {
          id: 'chunk4',
          choices: [{ delta: { content: 'Combined results: ' } }],
        },
        {
          id: 'chunk5',
          choices: [
            { delta: { content: 'First tool result and Second tool result' } },
          ],
        },
      ];

      // Mock streaming behavior
      mockOpenAiClient.chat.completions.create.mockImplementation((params) => {
        // Check if any of the messages is a tool message
        const hasToolMessages = params.messages.some(
          (msg) => msg.role === 'tool',
        );

        // If we have all tool results (should be 2), return final response
        const toolResultsCount = params.messages.filter(
          (msg) => msg.role === 'tool' && 'tool_call_id' in msg,
        ).length;

        if (hasToolMessages && toolResultsCount === 2) {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of finalResponseStream) {
                yield chunk;
              }
            },
          } as any;
        } else {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of multiToolCallStream) {
                yield chunk;
              }
            },
          } as any;
        }
      });

      // Create chat request
      const request: ChatRequest = { content: 'Use memory tools' };

      await service.getOrCreateChat(userId); // Ensures chat.id is available for getSystemPrompt

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the tool was called twice with different arguments
      expect(mockMemoryTool.execute).toHaveBeenCalledTimes(2);
      expect(mockMemoryTool.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'memory',
          arguments: '{"query":"first query"}',
        }),
      );
      expect(mockMemoryTool.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'memory',
          arguments: '{"query":"second query"}',
        }),
      );

      // Verify messages in database
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });

      // Should have:
      // 1 user message +
      // 1 assistant message with tool calls +
      // 2 tool result messages +
      // 1 final assistant message
      expect(savedMessages.length).toEqual(5);

      // Check tool messages
      const toolMessages = savedMessages.filter((m) => m.role === 'tool');
      expect(toolMessages.length).toEqual(2);

      // Verify tool call IDs
      expect(
        toolMessages.some(
          (m) => m.toolData && (m.toolData as any).toolCallId === toolCall1Id,
        ),
      ).toBeTruthy();
      expect(
        toolMessages.some(
          (m) => m.toolData && (m.toolData as any).toolCallId === toolCall2Id,
        ),
      ).toBeTruthy();

      // Check final message contains both tool results
      const finalMessage = savedMessages.find(
        (m) =>
          m.role === 'assistant' && m.content?.includes('Combined results'),
      );
      expect(finalMessage).toBeDefined();
      expect(finalMessage?.content).toContain('First tool result');
      expect(finalMessage?.content).toContain('Second tool result');
    });

    it('should handle errors during tool execution gracefully', async () => {
      // Setup
      const userId = randomUUID();
      const toolCallId = 'error-tool-call';
      const errorMessage = 'Tool execution failed with test error';

      // Insert user
      await dbClient.insert(users).values({ id: userId });

      // Mock tool execution to throw an error
      const mockMemoryTool = service['tools'][0];
      (mockMemoryTool.execute as any).mockRejectedValue(
        new Error(errorMessage),
      );

      // Setup response with tool call
      const toolCallStream = [
        {
          id: 'chunk1',
          choices: [
            {
              delta: {
                role: 'assistant',
                tool_calls: [
                  {
                    index: 0,
                    id: toolCallId,
                    function: {
                      name: 'memory',
                      arguments: '{"query":"failing query"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      // Response after error handling
      const errorHandlingStream = [
        {
          id: 'chunk2',
          choices: [{ delta: { content: 'Sorry, I encountered an error: ' } }],
        },
        {
          id: 'chunk3',
          choices: [{ delta: { content: errorMessage } }],
        },
      ];

      // Mock the streaming behavior
      mockOpenAiClient.chat.completions.create.mockImplementation((params) => {
        // Check if this is the second call (after tool execution with error)
        const isSecondCall = params.messages.some(
          (msg) =>
            msg.role === 'tool' &&
            'tool_call_id' in msg &&
            msg.content.includes('Error executing tool'),
        );

        if (isSecondCall) {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of errorHandlingStream) {
                yield chunk;
              }
            },
          } as any;
        } else {
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of toolCallStream) {
                yield chunk;
              }
            },
          } as any;
        }
      });

      // Create chat request
      const request: ChatRequest = {
        content: 'Use memory tool that will fail',
      };

      await service.getOrCreateChat(userId); // Ensures chat.id is available for getSystemPrompt

      // Execute the stream
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the tool was called and errored
      expect(mockMemoryTool.execute).toHaveBeenCalledTimes(1);
      expect(mockMemoryTool.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'memory',
          arguments: '{"query":"failing query"}',
        }),
      );

      // Verify the final message contains error information
      const finalMessage = events.find((e) => e.event === 'message');
      expect((finalMessage as any).content).toContain(errorMessage);

      // Verify messages in database
      const savedMessages = await dbClient.query.chatMessages.findMany({
        where: (messages, { eq }) => eq(messages.userId, userId),
      });

      // Should have: user message + assistant with tool call + tool error message + final assistant message
      expect(savedMessages.length).toEqual(4);

      // Check tool error message
      const toolMessage = savedMessages.find((m) => m.role === 'tool');
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.content).toContain('Error executing tool');
      expect(toolMessage?.content).toContain(errorMessage);

      // Check assistant with tool call
      const assistantWithToolCall = savedMessages.find(
        (m) => m.role === 'assistant' && m.toolData !== null,
      );
      expect(assistantWithToolCall).toBeDefined();

      // Check final message
      const finalDbMessage = savedMessages.find(
        (m) =>
          m.role === 'assistant' &&
          m.content?.includes('Sorry, I encountered an error'),
      );
      expect(finalDbMessage).toBeDefined();
    });

    it('should add timestamp system messages before user messages', async () => {
      // Setup
      const userId = randomUUID();
      const chatId = randomUUID();
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Insert user and chat
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Insert multiple messages with specific timestamps
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'First user message',
        createdAt: fiveMinutesAgo,
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'assistant',
        content: 'First assistant reply',
        createdAt: new Date(fiveMinutesAgo.getTime() + 1000),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'Second user message',
        createdAt: now,
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      // Mock streaming behavior for the test
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test response' } }] };
        },
      } as any);

      // Create the chat request (this will add a third user message)
      const request: ChatRequest = { content: 'New message' };

      // chatId is defined and used for inserting messages earlier in this test.
      // We call getOrCreateChat here to ensure that the chat context (including the chatId)
      // is correctly picked up by getSystemPrompt if it were to fetch it fresh,
      // and to be consistent with other tests. It will return the existing chat.
      await service.getOrCreateChat(userId);

      // Execute the chat stream (which internally calls getChatHistory)
      const streamGenerator = service.createChatStream(
        request,
        userId,
        'mock-token',
      );

      // Consume the stream to trigger the calls
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of streamGenerator) {
        // Just consume the stream
      }

      // Verify the OpenAI call includes timestamp system messages
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalled();
      const callArgs =
        mockOpenAiClient.chat.completions.create.mock.calls[0][0];

      // Extract the messages from the call
      const messages = callArgs.messages;

      // Find all system messages containing timestamps
      const timestampMessages = messages.filter(
        (msg) =>
          msg.role === 'system' &&
          typeof msg.content === 'string' &&
          msg.content.startsWith('Timestamp:'),
      );

      // We should have 3 timestamp messages (one for each user message, including the new one)
      expect(timestampMessages.length).toEqual(3);

      // Check that each user message is preceded by a timestamp message
      const messageSequence = messages.map((msg) => msg.role);

      // Find indices of user messages
      const userMessageIndices = messageSequence
        .map((role, index) => (role === 'user' ? index : -1))
        .filter((index) => index !== -1);

      // For each user message, verify there's a system message right before it
      userMessageIndices.forEach((userIndex) => {
        expect(messageSequence[userIndex - 1]).toEqual('system');

        // Verify the content of the timestamp message
        const timestampMsg = messages[userIndex - 1];
        expect(timestampMsg.content).toContain('Timestamp:');
        expect(typeof timestampMsg.content).toEqual('string');

        // Verify it's a valid ISO date string
        const timestampContent = timestampMsg.content as string;
        const isoDateString = timestampContent.replace('Timestamp: ', '');
        expect(() => new Date(isoDateString)).not.toThrow();
      });
    });
  });

  describe('getChatHistory', () => {
    const userId = randomUUID();
    const chatId = randomUUID();
    const agentScope = 'COACH';
    let originalMaxHistoryMessages: number;

    beforeEach(async () => {
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });
      // Store original MAX_HISTORY_MESSAGES and allow modification for tests
      originalMaxHistoryMessages = (service as any)['MAX_HISTORY_MESSAGES'];
    });

    afterEach(() => {
      // Restore original MAX_HISTORY_MESSAGES after each test
      (service as any)['MAX_HISTORY_MESSAGES'] = originalMaxHistoryMessages;
    });

    const insertMessage = async (message: {
      id?: string;
      role: 'user' | 'assistant' | 'tool' | 'system';
      content: string | null;
      toolData?: any;
      messageScope?: 'COACH' | 'ONBOARDING';
      createdAt?: Date;
      userId?: string;
      chatId?: string;
    }) => {
      return dbClient
        .insert(chatMessages)
        .values({
          id: message.id ?? randomUUID(),
          role: message.role,
          content: message.content ?? '',
          userId: message.userId ?? userId,
          chatId: message.chatId ?? chatId,
          toolData: message.toolData,
          messageScope: message.messageScope ?? agentScope,
          createdAt: message.createdAt ?? new Date(),
          embedding: null, // Not relevant for these tests
        })
        .returning();
    };

    it('should include tool message if its parent assistant message is present', async () => {
      const assistantMsgId = randomUUID();
      const toolCallId = `tc-${randomUUID()}`;
      await insertMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId,
              type: 'function',
              function: { name: 'testTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 2000),
      });
      await insertMessage({
        role: 'tool',
        content: 'Tool result',
        toolData: { toolCallId },
        createdAt: new Date(Date.now() - 1000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(2); // Assistant msg + Tool msg
      expect(history[0].role).toBe('assistant');
      expect(history[1].role).toBe('tool');
      expect((history[1] as any).tool_call_id).toBe(toolCallId);
    });

    it('should skip orphaned tool message if its parent assistant message is truncated', async () => {
      (service as any)['MAX_HISTORY_MESSAGES'] = 2; // Truncate to 2 most recent messages
      const toolCallId = `tc-${randomUUID()}`;

      // This assistant message will be truncated
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId,
              type: 'function',
              function: { name: 'testTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 3000),
      });
      // This tool message should be orphaned and skipped
      await insertMessage({
        role: 'tool',
        content: 'Orphaned tool result',
        toolData: { toolCallId },
        createdAt: new Date(Date.now() - 2000),
      });
      // This user message will be kept
      await insertMessage({
        role: 'user',
        content: 'Recent user message',
        createdAt: new Date(Date.now() - 1000),
      });
      // This system message (for the user message) will be kept

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );

      // Expected: system message for user + user message
      expect(history.length).toBe(2);
      expect(history.find((msg) => msg.role === 'tool')).toBeUndefined();
      expect(history[0].role).toBe('system');
      expect(history[1].role).toBe('user');
    });

    it('should skip tool message with missing toolCallId in toolData', async () => {
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: 'some-id',
              type: 'function',
              function: { name: 'testTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 2000),
      });
      await insertMessage({
        role: 'tool',
        content: 'Malformed tool result',
        toolData: { toolName: 'testTool' }, // Missing toolCallId
        createdAt: new Date(Date.now() - 1000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(1); // Only the assistant message
      expect(history[0].role).toBe('assistant');
      expect(history.find((msg) => msg.role === 'tool')).toBeUndefined();
    });

    it('should correctly include all messages if history is within MAX_HISTORY_MESSAGES limit', async () => {
      (service as any)['MAX_HISTORY_MESSAGES'] = 10;
      const toolCallId1 = `tc1-${randomUUID()}`;
      const toolCallId2 = `tc2-${randomUUID()}`;

      await insertMessage({
        role: 'user',
        content: 'User message 1',
        createdAt: new Date(Date.now() - 5000),
      });
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId1,
              type: 'function',
              function: { name: 'toolA', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 4000),
      });
      await insertMessage({
        role: 'tool',
        content: 'ToolA result',
        toolData: { toolCallId: toolCallId1 },
        createdAt: new Date(Date.now() - 3500),
      });
      await insertMessage({
        role: 'assistant',
        content: 'Assistant reply after toolA',
        createdAt: new Date(Date.now() - 3000),
      });
      await insertMessage({
        role: 'user',
        content: 'User message 2',
        createdAt: new Date(Date.now() - 2000),
      });
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId2,
              type: 'function',
              function: { name: 'toolB', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 1000),
      });
      await insertMessage({
        role: 'tool',
        content: 'ToolB result',
        toolData: { toolCallId: toolCallId2 },
        createdAt: new Date(Date.now() - 500),
      });

      // User messages (2) + System for user (2) + Assistant (2) + Tool (2) + Assistant (1) = 9 messages
      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(9);
      expect(history.filter((m) => m.role === 'user').length).toBe(2);
      expect(
        history.filter(
          (m) =>
            m.role === 'system' &&
            typeof m.content === 'string' &&
            m.content.startsWith('Timestamp:'),
        ).length,
      ).toBe(2);
      expect(history.filter((m) => m.role === 'assistant').length).toBe(3);
      expect(history.filter((m) => m.role === 'tool').length).toBe(2);
      expect(
        history.find(
          (m) => m.role === 'tool' && (m as any).tool_call_id === toolCallId1,
        ),
      ).toBeDefined();
      expect(
        history.find(
          (m) => m.role === 'tool' && (m as any).tool_call_id === toolCallId2,
        ),
      ).toBeDefined();
    });

    it('should skip tool message if its parent assistant message and the tool message itself are truncated', async () => {
      (service as any)['MAX_HISTORY_MESSAGES'] = 1; // Only most recent message (and its system prompt if user)
      const toolCallId = `tc-${randomUUID()}`;

      // These will be truncated
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId,
              type: 'function',
              function: { name: 'oldTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 5000),
      });
      await insertMessage({
        role: 'tool',
        content: 'Old tool result',
        toolData: { toolCallId },
        createdAt: new Date(Date.now() - 4000),
      });

      // This will be the only one kept (plus its system message)
      await insertMessage({
        role: 'user',
        content: 'Most recent user message',
        createdAt: new Date(Date.now() - 1000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(2); // system for user + user
      expect(history.find((msg) => msg.role === 'tool')).toBeUndefined();
      expect(history.find((msg) => msg.role === 'assistant')).toBeUndefined();
    });

    it('should skip a tool message if MAX_HISTORY_MESSAGES is 1 and the tool message is the most recent', async () => {
      (service as any)['MAX_HISTORY_MESSAGES'] = 1;
      const toolCallId = `tc-${randomUUID()}`;

      // Assistant message (older, will be truncated)
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId,
              type: 'function',
              function: { name: 'someTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 2000),
      });
      // Tool message (most recent, but parent will be truncated)
      await insertMessage({
        role: 'tool',
        content: 'Tool result',
        toolData: { toolCallId },
        createdAt: new Date(Date.now() - 1000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(0); // Tool message skipped as parent is not in the single message window
    });

    it('should include tool message if its parent assistant (with multiple tool_calls) is truncated', async () => {
      (service as any)['MAX_HISTORY_MESSAGES'] = 2; // Enough for the 2 tool messages, but not the parent assistant + other msgs
      const toolCallId1 = `m_tc1_trunc-${randomUUID()}`;
      const toolCallId2 = `m_tc2_trunc-${randomUUID()}`;

      // This assistant message will be truncated
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId1,
              type: 'function',
              function: { name: 'toolX', arguments: '{}' },
            },
            {
              id: toolCallId2,
              type: 'function',
              function: { name: 'toolY', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 5000),
      });
      // These tool messages should be skipped as their parent is truncated
      await insertMessage({
        role: 'tool',
        content: 'ToolX result - orphaned',
        toolData: { toolCallId: toolCallId1 },
        createdAt: new Date(Date.now() - 4000),
      });
      await insertMessage({
        role: 'tool',
        content: 'ToolY result - orphaned',
        toolData: { toolCallId: toolCallId2 },
        createdAt: new Date(Date.now() - 3000),
      });
      // This user message and its system message will be kept
      await insertMessage({
        role: 'user',
        content: 'Recent user message',
        createdAt: new Date(Date.now() - 1000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(history.length).toBe(2); // system for user + user
      expect(history.find((msg) => msg.role === 'tool')).toBeUndefined();
      expect(history.find((msg) => msg.role === 'assistant')).toBeUndefined();
    });

    it('should handle history correctly when messages are fetched by DESC createdAt and then reversed', async () => {
      // This test ensures the parent check logic works correctly after dbMessages.reverse()
      (service as any)['MAX_HISTORY_MESSAGES'] = 3;
      const toolCallId = `rev_tc-${randomUUID()}`;

      // Order of insertion (and thus default createdAt): user1, assistant1 (parent), tool1
      // DB fetch: tool1, assistant1, user1 (due to DESC order)
      // Reversed in code: user1, assistant1, tool1 (chronological)

      await insertMessage({
        role: 'user',
        content: 'User 1',
        createdAt: new Date(Date.now() - 3000),
      }); // Will be kept (with system)
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId,
              type: 'function',
              function: { name: 'revTool', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 2000), // Will be kept
      });
      await insertMessage({
        role: 'tool',
        content: 'Reversed Tool Result',
        toolData: { toolCallId },
        createdAt: new Date(Date.now() - 1000),
      }); // Will be kept

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );

      const historyCorrect = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );
      expect(historyCorrect.length).toBe(4);
      expect(
        history.find(
          (m) => m.role === 'tool' && (m as any).tool_call_id === toolCallId,
        ),
      ).toBeDefined();
    });

    it('should place tool messages directly after their parent assistant messages regardless of intervening messages', async () => {
      const toolCallId1 = `tc1-${randomUUID()}`;
      const toolCallId2 = `tc2-${randomUUID()}`;

      // Create messages with intervening messages between tool calls and their responses
      await insertMessage({
        role: 'user',
        content: 'First user message',
        createdAt: new Date(Date.now() - 6000),
      });

      // Assistant message with first tool call
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId1,
              type: 'function',
              function: { name: 'tool1', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 5000),
      });

      // Intervening user message BEFORE tool response
      await insertMessage({
        role: 'user',
        content: 'Intervening user message',
        createdAt: new Date(Date.now() - 4500),
      });

      // Tool response for first tool call (comes after intervening message in DB)
      await insertMessage({
        role: 'tool',
        content: 'Tool1 result',
        toolData: { toolCallId: toolCallId1 },
        createdAt: new Date(Date.now() - 4000),
      });

      // Assistant message with second tool call
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId2,
              type: 'function',
              function: { name: 'tool2', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 3000),
      });

      // Another intervening assistant message
      await insertMessage({
        role: 'assistant',
        content: 'Some other assistant response',
        createdAt: new Date(Date.now() - 2500),
      });

      // Tool response for second tool call
      await insertMessage({
        role: 'tool',
        content: 'Tool2 result',
        toolData: { toolCallId: toolCallId2 },
        createdAt: new Date(Date.now() - 2000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );

      // Find the positions of messages in the history
      const messageRoles = history.map((m) => m.role);
      const messageContents = history.map((m) => {
        if (m.role === 'tool' && 'tool_call_id' in m) {
          return `tool:${(m as any).tool_call_id}`;
        }
        if (m.role === 'assistant' && m.tool_calls) {
          return `assistant:with-tools`;
        }
        return m.content;
      });

      // Verify tool messages come directly after their parent assistant messages
      const firstAssistantIndex = messageContents.indexOf(
        'assistant:with-tools',
      );
      expect(messageContents[firstAssistantIndex + 1]).toBe(
        `tool:${toolCallId1}`,
      );

      const secondAssistantIndex = messageContents.lastIndexOf(
        'assistant:with-tools',
      );
      expect(messageContents[secondAssistantIndex + 1]).toBe(
        `tool:${toolCallId2}`,
      );

      // Verify the overall order includes intervening messages at their correct positions
      expect(messageRoles).toEqual([
        'system', // timestamp for first user
        'user', // First user message
        'assistant', // Assistant with tool call 1
        'tool', // Tool1 result (moved to be right after its parent)
        'system', // timestamp for intervening user
        'user', // Intervening user message
        'assistant', // Assistant with tool call 2
        'tool', // Tool2 result (moved to be right after its parent)
        'assistant', // Some other assistant response
      ]);
    });

    it('should handle multiple tool calls in a single assistant message with proper ordering', async () => {
      const toolCallId1 = `multi-tc1-${randomUUID()}`;
      const toolCallId2 = `multi-tc2-${randomUUID()}`;
      const toolCallId3 = `multi-tc3-${randomUUID()}`;

      // Assistant message with multiple tool calls
      await insertMessage({
        role: 'assistant',
        content: null,
        toolData: {
          toolCalls: [
            {
              id: toolCallId1,
              type: 'function',
              function: { name: 'toolA', arguments: '{}' },
            },
            {
              id: toolCallId2,
              type: 'function',
              function: { name: 'toolB', arguments: '{}' },
            },
            {
              id: toolCallId3,
              type: 'function',
              function: { name: 'toolC', arguments: '{}' },
            },
          ],
        },
        createdAt: new Date(Date.now() - 5000),
      });

      // Tool responses come in different order than tool calls
      await insertMessage({
        role: 'tool',
        content: 'ToolB result',
        toolData: { toolCallId: toolCallId2 },
        createdAt: new Date(Date.now() - 4000),
      });

      await insertMessage({
        role: 'tool',
        content: 'ToolC result',
        toolData: { toolCallId: toolCallId3 },
        createdAt: new Date(Date.now() - 3000),
      });

      await insertMessage({
        role: 'tool',
        content: 'ToolA result',
        toolData: { toolCallId: toolCallId1 },
        createdAt: new Date(Date.now() - 2000),
      });

      const history = await service['getChatHistory'](
        userId,
        chatId,
        agentScope,
      );

      // All tool responses should come directly after the assistant message
      expect(history.length).toBe(4); // 1 assistant + 3 tools
      expect(history[0].role).toBe('assistant');
      expect(history[1].role).toBe('tool');
      expect(history[2].role).toBe('tool');
      expect(history[3].role).toBe('tool');

      // Tool responses should be in the order of tool calls, not creation time
      expect((history[1] as any).tool_call_id).toBe(toolCallId1);
      expect((history[2] as any).tool_call_id).toBe(toolCallId2);
      expect((history[3] as any).tool_call_id).toBe(toolCallId3);
    });
  });

  describe('onApplicationBootstrap', () => {
    it('should add embeddings to messages without them', async () => {
      // Setup - create messages without embeddings
      const userId = randomUUID();
      const chatId = randomUUID();

      // Insert user and chat
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Insert messages without embeddings
      const message1Id = randomUUID();
      const message2Id = randomUUID();
      const message3Id = randomUUID(); // This one will be empty and should be skipped

      await dbClient.insert(chatMessages).values({
        id: message1Id,
        role: 'user',
        content: 'Message without embedding 1',
        userId,
        chatId,
        embedding: null, // Explicit null embedding
        messageScope: 'COACH',
        toolData: null,
      });
      await dbClient.insert(chatMessages).values({
        id: message2Id,
        role: 'assistant',
        content: 'Message without embedding 2',
        userId,
        chatId,
        embedding: null,
        messageScope: 'COACH',
        toolData: null,
      });
      await dbClient.insert(chatMessages).values({
        id: message3Id,
        role: 'user',
        content: '', // Empty content should be skipped
        userId,
        chatId,
        embedding: null,
        messageScope: 'COACH',
        toolData: null,
      });

      // Spy on setChatMessageEmbedding
      const setChatMessageEmbeddingSpy = vi.spyOn(
        service,
        'setChatMessageEmbedding',
      );

      // Execute
      await service.onApplicationBootstrap();

      // Verify setChatMessageEmbedding was called for non-empty messages
      expect(setChatMessageEmbeddingSpy).toHaveBeenCalledTimes(2);
      expect(setChatMessageEmbeddingSpy).toHaveBeenCalledWith(
        message1Id,
        'Message without embedding 1',
      );
      expect(setChatMessageEmbeddingSpy).toHaveBeenCalledWith(
        message2Id,
        'Message without embedding 2',
      );

      // Verify it was not called for the empty message
      expect(setChatMessageEmbeddingSpy).not.toHaveBeenCalledWith(
        message3Id,
        '',
      );

      // Verify embeddings were added in the database
      const updatedMessages = await dbClient.query.chatMessages.findMany({
        where: (chatMessages, { eq, and, isNotNull }) =>
          and(
            eq(chatMessages.chatId, chatId),
            isNotNull(chatMessages.embedding),
          ),
      });

      // Only the two non-empty messages should have embeddings
      expect(updatedMessages.length).toEqual(2);
      expect(updatedMessages.some((m) => m.id === message1Id)).toBeTruthy();
      expect(updatedMessages.some((m) => m.id === message2Id)).toBeTruthy();
      expect(updatedMessages.some((m) => m.id === message3Id)).toBeFalsy();
    });
  });

  describe('getChatState', () => {
    const mockApiToken = 'mock-evogenom-api-token';

    it('should return NOT_ALLOWED if user has no purchases', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId, isOnboarded: false });
      (mockEvogenomApiClient.getUserOrders as any).mockResolvedValue([]);

      const result = await service.getChatState(userId, mockApiToken);

      expect(result.state).toEqual(ChatState.NOT_ALLOWED);
      expect(mockEvogenomApiClient.getUserOrders).toHaveBeenCalledWith(
        userId,
        mockApiToken,
      );
    });

    it('should return NEW_USER if user has purchases but is not onboarded', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId, isOnboarded: false });
      (mockEvogenomApiClient.getUserOrders as any).mockResolvedValue([
        { id: 'order1' },
      ]);

      const result = await service.getChatState(userId, mockApiToken);

      expect(result.state).toEqual(ChatState.NEW_USER);
    });

    it('should return ALLOWED if user has purchases and is onboarded', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId, isOnboarded: true });
      (mockEvogenomApiClient.getUserOrders as any).mockResolvedValue([
        { id: 'order1' },
      ]);

      const result = await service.getChatState(userId, mockApiToken);

      expect(result.state).toEqual(ChatState.ALLOWED);
    });

    it('should ensure user exists if not present and then return NOT_ALLOWED if no purchases', async () => {
      const userId = randomUUID(); // New user, not in DB yet
      (mockEvogenomApiClient.getUserOrders as any).mockResolvedValue([]);

      const result = await service.getChatState(userId, mockApiToken);

      expect(result.state).toEqual(ChatState.NOT_ALLOWED);
      const userInDb = await dbClient.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.isOnboarded).toBe(false); // Default value
    });

    it('should throw an error if EvogenomApiClient fails', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId, isOnboarded: false });
      const errorMessage = 'Evogenom API error';
      (mockEvogenomApiClient.getUserOrders as any).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.getChatState(userId, mockApiToken)).rejects.toThrow(
        `Failed to get chat state: ${errorMessage}`,
      );
    });
  });

  describe('getCurrentWellnessPlan', () => {
    it('should return the wellness plan if a chat with a wellness plan exists', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      const wellnessPlanContent = '## My Wellness Plan\n- Eat healthy';
      await dbClient.insert(users).values({ id: userId });
      await dbClient
        .insert(chats)
        .values({ id: chatId, userId, wellnessPlan: wellnessPlanContent });

      const result = await service.getCurrentWellnessPlan(userId);
      expect(result).toEqual(wellnessPlanContent);
    });

    it('should return null if the latest chat has no wellness plan', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId }); // wellnessPlan is omitted

      const result = await service.getCurrentWellnessPlan(userId);
      expect(result).toBeNull();
    });

    it('should return null if the user has no chats', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      const result = await service.getCurrentWellnessPlan(userId);
      expect(result).toBeNull();
    });

    it('should return the wellness plan from the most recent chat if multiple chats exist', async () => {
      const userId = randomUUID();
      const olderChatId = randomUUID();
      const newerChatId = randomUUID();
      const olderWellnessPlan = '## Old Plan';
      const newerWellnessPlan = '## Newer Plan';

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({
        id: olderChatId,
        userId,
        wellnessPlan: olderWellnessPlan,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });
      await dbClient.insert(chats).values({
        id: newerChatId,
        userId,
        wellnessPlan: newerWellnessPlan,
        createdAt: new Date(), // now
      });

      const result = await service.getCurrentWellnessPlan(userId);
      expect(result).toEqual(newerWellnessPlan);
    });

    it('should return null if the most recent chat has a null wellness plan even if older ones have content', async () => {
      const userId = randomUUID();
      const olderChatId = randomUUID();
      const newerChatId = randomUUID();
      const olderWellnessPlan = '## Old Plan';

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({
        id: olderChatId,
        userId,
        wellnessPlan: olderWellnessPlan,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });
      await dbClient.insert(chats).values({
        id: newerChatId,
        userId,
        // wellnessPlan is omitted for the newer chat
        createdAt: new Date(), // now
      });

      const result = await service.getCurrentWellnessPlan(userId);
      expect(result).toBeNull();
    });
  });

  describe('getQuickResponses', () => {
    it('should return empty quick responses when no messages exist', async () => {
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      const result = await service.getQuickResponses(userId);

      expect(result).toEqual({ quickResponses: [] });
    });

    it('should return empty quick responses when no assistant messages exist', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      const result = await service.getQuickResponses(userId);

      expect(result).toEqual({ quickResponses: [] });
    });

    it('should generate quick responses and cache them when no cache exists', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const assistantMessageId = randomUUID();
      await dbClient.insert(chatMessages).values({
        id: assistantMessageId,
        role: 'assistant',
        content: 'Hi there! How are you feeling today?',
        createdAt: new Date(Date.now() - 1000),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'Hello',
        createdAt: new Date(Date.now() - 2000),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      const mockGeneratedResponses = ['Great!', 'Tell me more', 'I need help'];
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                responses: mockGeneratedResponses,
              }),
            },
          },
        ],
      });

      const result = await service.getQuickResponses(userId);

      expect(result.quickResponses).toHaveLength(mockGeneratedResponses.length);
      expect(result.quickResponses.map((r) => r.text)).toEqual(
        mockGeneratedResponses,
      );
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledTimes(1);

      // Verify responses were cached
      const cached = await dbClient.query.quickResponses.findFirst({
        where: (qr, { eq, and }) =>
          and(
            eq(qr.chatId, chatId),
            eq(qr.assistantMessageId, assistantMessageId),
          ),
      });
      expect(cached).toBeDefined();
      expect(cached?.responses).toEqual(mockGeneratedResponses);

      // Verify PromptService was called correctly
      expect(
        mockPromptService.getQuickResponseSystemPrompt,
      ).toHaveBeenCalledWith(
        userId,
        'Hi there! How are you feeling today?',
        expect.arrayContaining([
          'User: Hello',
          'Assistant: Hi there! How are you feeling today?',
        ]),
      );
    });

    it('should return cached quick responses if available for the latest assistant message', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const assistantMessageId = randomUUID();
      await dbClient.insert(chatMessages).values({
        id: assistantMessageId,
        role: 'assistant',
        content: 'Latest assistant message content',
        createdAt: new Date(),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
      });
      // Older message to ensure we pick the latest assistant message
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'User asking something',
        createdAt: new Date(Date.now() - 1000),
        userId,
        chatId,
        messageScope: 'COACH',
      });

      const cachedResponses = ['Cached Option 1', 'Cached Option 2'];
      await dbClient.insert(quickResponses).values({
        chatId,
        assistantMessageId,
        responses: cachedResponses,
      });

      // Clear any previous mock calls to ensure we're testing this specific scenario
      mockOpenAiClient.chat.completions.create.mockClear();

      const result = await service.getQuickResponses(userId);

      expect(result.quickResponses).toHaveLength(cachedResponses.length);
      expect(result.quickResponses.map((r) => r.text)).toEqual(cachedResponses);
      expect(mockOpenAiClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should generate new responses if cache exists for an OLDER assistant message', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      const oldAssistantMessageId = randomUUID();
      await dbClient.insert(chatMessages).values({
        id: oldAssistantMessageId,
        role: 'assistant',
        content: 'Old assistant message',
        createdAt: new Date(Date.now() - 2000), // Older message
        userId,
        chatId,
        messageScope: 'COACH',
      });

      const oldCachedResponses = ['Old Cached 1', 'Old Cached 2'];
      await dbClient.insert(quickResponses).values({
        chatId,
        assistantMessageId: oldAssistantMessageId,
        responses: oldCachedResponses,
      });

      const newAssistantMessageId = randomUUID();
      const newAssistantContent = 'New assistant message content';
      await dbClient.insert(chatMessages).values({
        id: newAssistantMessageId,
        role: 'assistant',
        content: newAssistantContent,
        createdAt: new Date(Date.now() - 1000), // Newer message
        userId,
        chatId,
        messageScope: 'COACH',
      });
      // User message to provide context
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'user',
        content: 'User query for new assistant message',
        createdAt: new Date(Date.now() - 1500),
        userId,
        chatId,
        messageScope: 'COACH',
      });

      const newGeneratedResponses = ['Fresh Option A', 'Fresh Option B'];
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ responses: newGeneratedResponses }),
            },
          },
        ],
      });

      const result = await service.getQuickResponses(userId);

      expect(result.quickResponses.map((r) => r.text)).toEqual(
        newGeneratedResponses,
      );
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledTimes(1);

      // Verify new responses were cached for the NEW assistant message
      const newCached = await dbClient.query.quickResponses.findFirst({
        where: (qr, { eq, and }) =>
          and(
            eq(qr.chatId, chatId),
            eq(qr.assistantMessageId, newAssistantMessageId),
          ),
      });
      expect(newCached).toBeDefined();
      expect(newCached?.responses).toEqual(newGeneratedResponses);

      // Verify old cache still exists (or was not overwritten by mistake for the wrong assistantId)
      const oldCacheStillExists = await dbClient.query.quickResponses.findFirst(
        {
          where: (qr, { eq, and }) =>
            and(
              eq(qr.chatId, chatId),
              eq(qr.assistantMessageId, oldAssistantMessageId),
            ),
        },
      );
      expect(oldCacheStillExists).toBeDefined();
      expect(oldCacheStillExists?.responses).toEqual(oldCachedResponses);
    });

    it('should handle invalid JSON response gracefully when generating new responses', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'assistant',
        content: 'Hi there!',
        createdAt: new Date(),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      // Mock invalid JSON response
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      const result = await service.getQuickResponses(userId);

      expect(result).toEqual({ quickResponses: [] });
    });

    it('should handle missing responses property gracefully', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'assistant',
        content: 'Hi there!',
        createdAt: new Date(),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      // Mock response with object but missing responses property
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ someOtherProperty: 'value' }),
            },
          },
        ],
      });

      const result = await service.getQuickResponses(userId);

      expect(result).toEqual({ quickResponses: [] });
    });

    it('should filter out empty strings from responses', async () => {
      const userId = randomUUID();
      const chatId = randomUUID();

      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        role: 'assistant',
        content: 'Hi there!',
        createdAt: new Date(),
        userId,
        chatId,
        messageScope: 'COACH',
        toolData: null,
        embedding: null,
      });

      // Mock response with some empty strings
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                responses: [
                  'Great!',
                  '',
                  '  ',
                  'Tell me more',
                  null,
                  'Thanks!',
                ],
              }),
            },
          },
        ],
      });

      const result = await service.getQuickResponses(userId);

      expect(result.quickResponses).toHaveLength(3);
      expect(result.quickResponses.map((r) => r.text)).toEqual([
        'Great!',
        'Tell me more',
        'Thanks!',
      ]);
    });
  });
});
