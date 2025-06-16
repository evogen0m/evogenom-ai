/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chatMessages, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { OpenAiProvider } from 'src/openai/openai';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryTool } from './memory-tool';
import { ToolCall } from './tool';

describe('MemoryTool', () => {
  let memoryTool: MemoryTool;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;
  let userId: string;

  const mockMiniOpenAiClient = {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            { message: { content: 'This is a summary of the conversation.' } },
          ],
        }),
      },
    },
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create test embedding
    const mockEmbedding = Array(1536).fill(0.1);

    // Set up OpenAI mock
    openAiProvider = {
      createChatCompletion: vi.fn().mockImplementation(async (params) => {
        // Return the mock response based on the params
        return mockMiniOpenAiClient.chat.completions.create(params);
      }),
      generateEmbedding: vi.fn().mockResolvedValue(mockEmbedding),
    } as unknown as OpenAiProvider;

    const mockConfigService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === 'AZURE_OPENAI_MODEL_MINI') return 'mock-mini-model';
        if (key === 'AZURE_OPENAI_EMBEDDING_MODEL')
          return 'text-embedding-3-small';
        return 'mock-value';
      }),
    };

    const moduleBuilder = createTestingModuleWithDb({
      providers: [
        MemoryTool,
        {
          provide: OpenAiProvider,
          useValue: openAiProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    const module = await moduleBuilder.compile();

    memoryTool = module.get<MemoryTool>(MemoryTool);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE chat_message CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE chat CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);

    // Generate a test user ID and create user
    userId = randomUUID();
    await dbClient.insert(users).values({ id: userId });
  });

  describe('when searching memory', () => {
    let chatId: string;

    beforeEach(async () => {
      // Setup chat messages in the database with embeddings
      const mockEmbedding = Array(1536).fill(0.1);

      // Create chat entries first
      chatId = randomUUID();
      const chat2Id = randomUUID();
      const chat3Id = randomUUID();

      await dbClient.insert(chats).values([
        { id: chatId, userId },
        { id: chat2Id, userId },
        { id: chat3Id, userId },
      ]);

      // Insert a series of messages with timestamps
      await dbClient.insert(chatMessages).values([
        {
          id: randomUUID(),
          userId,
          chatId: chatId,
          content: 'Hello, how are you?',
          role: 'user',
          createdAt: new Date(Date.now() - 3000),
          embedding: mockEmbedding,
          messageScope: 'COACH',
          toolData: null,
        },
        {
          id: randomUUID(),
          userId,
          chatId: chat2Id,
          content: 'I am doing well, thank you for asking!',
          role: 'assistant',
          createdAt: new Date(Date.now() - 2000),
          embedding: mockEmbedding,
          messageScope: 'COACH',
          toolData: null,
        },
        {
          id: randomUUID(),
          userId,
          chatId: chat3Id,
          content: 'Can you help me with a project about machine learning?',
          role: 'user',
          createdAt: new Date(Date.now() - 1000),
          embedding: mockEmbedding,
          messageScope: 'COACH',
          toolData: null,
        },
      ]);
    });

    it('should return a summary when relevant memories are found', async () => {
      // Mock _getUserChatId to return the chatId
      vi.spyOn(memoryTool as any, '_getUserChatId').mockResolvedValue(chatId);

      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'machine learning',
        }),
      };

      // Execute the tool
      const result = await memoryTool.execute(userId, toolCall);

      // Verify embeddings were generated with chatId
      expect(openAiProvider.generateEmbedding).toHaveBeenCalledWith(
        'machine learning',
        chatId,
      );

      // Verify summary was generated
      expect(openAiProvider.createChatCompletion).toHaveBeenCalled();

      // The result should include the summary
      expect(result).toContain(
        'What you remember given the search query "machine learning"',
      );
      expect(result).toContain('This is a summary of the conversation.');
    });

    it('should return a message when no chat history exists', async () => {
      // Mock _getUserChatId to return the chatId
      vi.spyOn(memoryTool as any, '_getUserChatId').mockResolvedValue(chatId);

      // Mock similarity search to return an empty array (no messages in database)
      vi.spyOn(
        memoryTool as any,
        '_performSimilaritySearch',
      ).mockResolvedValueOnce([]);

      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'something not in memory',
        }),
      };

      // Execute the tool
      const result = await memoryTool.execute(userId, toolCall);

      // Verify the response for no chat history
      expect(result).toContain('No chat history found to search from.');
    });

    it('should handle embedding generation error gracefully', async () => {
      // Mock _getUserChatId to return the chatId
      vi.spyOn(memoryTool as any, '_getUserChatId').mockResolvedValue(chatId);

      // Mock embedding generation to fail
      vi.mocked(openAiProvider.generateEmbedding).mockRejectedValueOnce(
        new Error('Embedding generation failed'),
      );

      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'machine learning',
        }),
      };

      // Execute the tool and expect it to throw
      await expect(memoryTool.execute(userId, toolCall)).rejects.toThrow();
    });

    it('should handle summary generation error gracefully', async () => {
      // Mock _getUserChatId to return the chatId
      vi.spyOn(memoryTool as any, '_getUserChatId').mockResolvedValue(chatId);

      // Mock summary generation to fail
      mockMiniOpenAiClient.chat.completions.create.mockRejectedValueOnce(
        new Error('Summary generation failed'),
      );

      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'machine learning',
        }),
      };

      // Execute the tool - this should still work but with a default message
      const result = await memoryTool.execute(userId, toolCall);

      // Verify we get a result even when summary generation fails
      expect(result).toContain(
        'What you remember given the search query "machine learning"',
      );
    });

    it('should return a message when no chat is found for the user', async () => {
      // Mock _getUserChatId to return null (no chat found)
      vi.spyOn(memoryTool as any, '_getUserChatId').mockResolvedValue(null);

      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'machine learning',
        }),
      };

      // Execute the tool
      const result = await memoryTool.execute(userId, toolCall);

      // Verify the response for no chat found
      expect(result).toContain('No chat history found to search from.');
    });
  });

  describe('when checking if the tool can execute', () => {
    it('should return true for search_memory tool calls', () => {
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: '{}',
      };

      expect(memoryTool.canExecute(toolCall)).toBe(true);
    });

    it('should return false for other tool calls', () => {
      const toolCall: ToolCall = {
        name: 'some_other_tool',
        arguments: '{}',
      };

      expect(memoryTool.canExecute(toolCall)).toBe(false);
    });
  });

  describe('when fetching context for messages', () => {
    beforeEach(async () => {
      // Setup a sequence of messages with timestamps
      const mockEmbedding = Array(1536).fill(0.1);

      // Create a chat first
      const chatId = randomUUID();
      await dbClient.insert(chats).values({ id: chatId, userId });

      // Insert a series of messages with sequential timestamps
      const now = Date.now();
      for (let i = 0; i < 15; i++) {
        await dbClient.insert(chatMessages).values({
          id: randomUUID(),
          userId,
          chatId,
          content: `Message ${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          createdAt: new Date(now - (15 - i) * 1000), // Older to newer
          embedding: mockEmbedding,
          messageScope: 'COACH',
          toolData: null,
        });
      }
    });

    it('should fetch proper context around matched messages', async () => {
      // Create a mock tool call
      const toolCall: ToolCall = {
        name: 'search_memory',
        arguments: JSON.stringify({
          searchString: 'Message', // Should match all messages
        }),
      };

      // Execute the tool
      await memoryTool.execute(userId, toolCall);

      // Verify that the summary request includes context messages
      const createChatCompletionSpy = vi.mocked(
        openAiProvider.createChatCompletion,
      );
      expect(createChatCompletionSpy).toHaveBeenCalled();

      const summaryCallArgs = createChatCompletionSpy.mock.calls[0][0];

      // The prompt should contain both the main messages and context
      expect(summaryCallArgs.messages[0].content).toContain(
        'MESSAGE SEPARATOR',
      );

      // Ensure the chat completion was called for generating the summary
      expect(summaryCallArgs.model).toBe('mini');
    });
  });
});
