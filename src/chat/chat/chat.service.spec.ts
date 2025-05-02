import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chatMessages, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAiProvider } from '../../openai/openai';
import { ChatEventResponse, ChatRequest } from '../dto/chat';
import { FollowupTool } from '../tool/followup.tool';
import { MemoryTool } from '../tool/memory-tool';
import { Tool } from '../tool/tool';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';

describe('ChatService', () => {
  let service: ChatService;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;

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
      getOpenAiClient: vi.fn().mockReturnValue(mockOpenAiClient),
      generateEmbedding: vi.fn().mockResolvedValue(mockEmbedding),
    } as unknown as OpenAiProvider;

    const mockPromptService = {
      getSystemPrompt: vi.fn().mockResolvedValue('mock system prompt'),
    };

    const mockConfigService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === 'AZURE_OPENAI_MODEL') return 'mock-model';
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
      ],
    });

    const module = await moduleBuilder.compile(); // Compile the module

    service = module.get<ChatService>(ChatService);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE chat_message CASCADE`);
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
    it('should return messages for a user', async () => {
      // Setup
      const userId = randomUUID();
      const chatId = randomUUID();

      // Insert user and chat
      await dbClient.insert(users).values({ id: userId });
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Insert messages
      await dbClient.insert(chatMessages).values([
        {
          id: randomUUID(),
          role: 'assistant',
          content: 'Hi there',
          createdAt: new Date(),
          userId,
          chatId,
        },
        {
          id: randomUUID(),
          role: 'user',
          content: 'Hello',
          createdAt: new Date(Date.now() - 1000),
          userId,
          chatId,
        },
      ]);

      // Execute
      const result = await service.getMessages(userId);

      // Verify
      expect(result.length).toEqual(2);
      // The result is ordered by createdAt DESC, so most recent first
      expect(result[0].role).toEqual('assistant');
      expect(result[0].content).toEqual('Hi there');
      expect(result[1].role).toEqual('user');
      expect(result[1].content).toEqual('Hello');
    });

    it('should return empty array when no messages exist', async () => {
      // Setup
      const userId = randomUUID();
      await dbClient.insert(users).values({ id: userId });

      // Execute
      const result = await service.getMessages(userId);

      // Verify
      expect(result).toEqual([]);
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
      (openAiProvider.getOpenAiClient as any).mockReturnValue(mockOpenAiClient);

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
      (openAiProvider.getOpenAiClient as any).mockReturnValue(mockOpenAiClient);

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
      await dbClient.insert(chatMessages).values([
        {
          id: randomUUID(),
          role: 'user',
          content: 'First user message',
          createdAt: fiveMinutesAgo,
          userId,
          chatId,
        },
        {
          id: randomUUID(),
          role: 'assistant',
          content: 'First assistant reply',
          createdAt: new Date(fiveMinutesAgo.getTime() + 1000),
          userId,
          chatId,
        },
        {
          id: randomUUID(),
          role: 'user',
          content: 'Second user message',
          createdAt: now,
          userId,
          chatId,
        },
      ]);

      // Mock streaming behavior for the test
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test response' } }] };
        },
      } as any);

      // Create the chat request (this will add a third user message)
      const request: ChatRequest = { content: 'New message' };

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
          msg.content.startsWith('Current timestamp:'),
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
        expect(timestampMsg.content).toContain('Current timestamp:');
        expect(typeof timestampMsg.content).toEqual('string');

        // Verify it's a valid ISO date string
        const timestampContent = timestampMsg.content as string;
        const isoDateString = timestampContent.replace(
          'Current timestamp: ',
          '',
        );
        expect(() => new Date(isoDateString)).not.toThrow();
      });
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

      await dbClient.insert(chatMessages).values([
        {
          id: message1Id,
          role: 'user',
          content: 'Message without embedding 1',
          userId,
          chatId,
          embedding: null, // Explicit null embedding
        },
        {
          id: message2Id,
          role: 'assistant',
          content: 'Message without embedding 2',
          userId,
          chatId,
          embedding: null,
        },
        {
          id: message3Id,
          role: 'user',
          content: '', // Empty content should be skipped
          userId,
          chatId,
          embedding: null,
        },
      ]);

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
});
