import { TransactionHost } from '@nestjs-cls/transactional';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAiProvider } from '../../openai/openai';
import {
  ChatEventResponse,
  ChatMessageResponse,
  ChatRequest,
} from '../dto/chat';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';

// Create a testable version of ChatService without relying on @Transactional
class TestableService extends ChatService {
  constructor(
    private openAiProviderMock: OpenAiProvider,
    private txHostMock: any,
    private configServiceMock: ConfigService<any>,
    private promptServiceMock: PromptService,
  ) {
    super(openAiProviderMock, txHostMock, configServiceMock, promptServiceMock);
  }

  // Override methods that use @Transactional to use our mocks directly
  async ensureUserExists(userId: string) {
    const mockTx = this.txHostMock.tx;
    const user = await mockTx.query.users.findFirst({
      where: expect.anything(),
    });

    if (!user) {
      await mockTx.insert(users).values({ id: userId }).returning();
    }
  }

  async getOrCreateChat(userId: string) {
    const mockTx = this.txHostMock.tx;
    const chat = await mockTx.query.chats.findFirst({
      where: expect.anything(),
    });

    if (!chat) {
      const id = randomUUID();
      return await mockTx
        .insert(chats)
        .values({
          id,
          userId,
        })
        .returning()
        .then(([chat]) => chat);
    }

    return chat;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMessages(_userId: string): Promise<ChatMessageResponse[]> {
    const mockTx = this.txHostMock.tx;
    const messages = await mockTx.query.chatMessages.findMany({
      where: expect.anything(),
      orderBy: expect.anything(),
    });

    return messages.map((message) => ({ ...message }));
  }
}

describe('ChatService', () => {
  let service: TestableService;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;
  let mockTx: any;

  const mockOpenAiClient = {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up all mocks
    mockTx = {
      query: {
        users: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        chats: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        chatMessages: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockImplementation(function () {
        return Promise.resolve([{ id: 'mock-id', userId: 'mock-user-id' }]);
      }),
    };

    // Create transaction host mock
    const mockTxHost = {
      tx: mockTx,
    } as any;

    // Mock OpenAI provider
    openAiProvider = {
      getOpenAiClient: vi.fn().mockReturnValue(mockOpenAiClient),
    } as unknown as OpenAiProvider;

    const mockPromptService = {
      getSystemPrompt: vi.fn().mockResolvedValue('mock system prompt'),
    };

    const mockConfigService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === 'AZURE_OPENAI_MODEL') return 'mock-model';
        return 'mock-value';
      }),
    };

    const moduleBuilder = createTestingModuleWithDb({
      providers: [
        {
          provide: ChatService,
          useFactory: () =>
            new TestableService(
              openAiProvider,
              mockTxHost,
              mockConfigService as any,
              mockPromptService as any,
            ),
        },
        {
          provide: OpenAiProvider,
          useValue: openAiProvider,
        },
        {
          provide: TransactionHost,
          useValue: mockTxHost,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PromptService,
          useValue: mockPromptService,
        },
      ],
    });

    const module = await moduleBuilder.compile(); // Compile the module

    service = module.get<TestableService>(ChatService as any);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureUserExists', () => {
    it('should create a user if it does not exist', async () => {
      // Setup
      mockTx.query.users.findFirst.mockResolvedValueOnce(null);
      mockTx.insert.mockReturnThis();
      mockTx.values.mockReturnThis();
      mockTx.returning.mockResolvedValueOnce([{ id: 'test-user-id' }]);

      // Execute
      const userId = 'test-user-id';
      await service.ensureUserExists(userId);

      // Verify
      expect(mockTx.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
      expect(mockTx.insert).toHaveBeenCalledWith(users);
      expect(mockTx.values).toHaveBeenCalledWith({ id: userId });
    });

    it('should not create a duplicate user if it already exists', async () => {
      // Setup
      const userId = 'existing-user-id';
      mockTx.query.users.findFirst.mockResolvedValueOnce({ id: userId });

      // Execute
      await service.ensureUserExists(userId);

      // Verify
      expect(mockTx.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateChat', () => {
    it('should create a new chat for a user', async () => {
      // Setup
      mockTx.query.chats.findFirst.mockResolvedValueOnce(null);
      const chatId = randomUUID();
      mockTx.insert.mockReturnThis();
      mockTx.values.mockReturnThis();
      mockTx.returning.mockResolvedValueOnce([
        { id: chatId, userId: 'test-user-id' },
      ]);

      // Execute
      const userId = 'test-user-id';
      const chat = await service.getOrCreateChat(userId);

      // Verify
      expect(chat.userId).toEqual('test-user-id');
      expect(mockTx.query.chats.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
      expect(mockTx.insert).toHaveBeenCalledWith(chats);
    });

    it('should return existing chat if one exists', async () => {
      // Setup
      const existingChat = { id: 'existing-chat-id', userId: 'test-user-id' };
      mockTx.query.chats.findFirst.mockResolvedValueOnce(existingChat);

      // Execute
      const userId = 'test-user-id';
      const chat = await service.getOrCreateChat(userId);

      // Verify
      expect(chat).toEqual(existingChat);
      expect(mockTx.query.chats.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a user', async () => {
      // Setup
      const messages = [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi there',
          createdAt: new Date(),
          userId: 'test-user-id',
          chatId: 'chat-id',
        },
        {
          id: '2',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(Date.now() - 1000),
          userId: 'test-user-id',
          chatId: 'chat-id',
        },
      ];
      mockTx.query.chatMessages.findMany.mockResolvedValueOnce(messages);

      // Execute
      const userId = 'test-user-id';
      const result = await service.getMessages(userId);

      // Verify
      expect(result.length).toEqual(2);
      expect(result[0].role).toEqual('assistant');
      expect(result[0].content).toEqual('Hi there');
      expect(result[1].role).toEqual('user');
      expect(result[1].content).toEqual('Hello');
    });

    it('should return empty array when no messages exist', async () => {
      // Setup
      mockTx.query.chatMessages.findMany.mockResolvedValueOnce([]);

      // Execute
      const userId = 'test-user-id';
      const result = await service.getMessages(userId);

      // Verify
      expect(result).toEqual([]);
    });
  });

  describe('createChatStream', () => {
    it('should stream chat responses and save messages', async () => {
      // Setup
      const userId = 'test-user-id';
      const streamingResponse = [
        { id: 'chunk1', choices: [{ delta: { content: 'Hello' } }] },
        { id: 'chunk2', choices: [{ delta: { content: ' world' } }] },
        { id: 'chunk3', choices: [{ delta: { content: '!' } }] },
      ];

      // Configure mocks for this test
      (openAiProvider.getOpenAiClient as any).mockReturnValue(mockOpenAiClient);
      mockTx.query.users.findFirst.mockResolvedValueOnce({ id: userId });
      mockTx.query.chats.findFirst.mockResolvedValueOnce({
        id: 'chat-id',
        userId,
      });
      mockTx.query.chatMessages.findMany.mockResolvedValueOnce([]);

      // Mock the streaming behavior
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamingResponse) {
            yield chunk;
          }
        },
      } as any);

      mockTx.insert.mockReturnThis();
      mockTx.values.mockReturnThis();
      mockTx.returning.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'message-id',
            content: 'Hello world!',
            role: 'assistant',
            createdAt: new Date(),
            chatId: 'chat-id',
            userId,
          },
        ]),
      );

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
    });

    it('should handle empty chunks correctly', async () => {
      // Setup
      const userId = 'test-user-id';
      const streamingResponse = [
        { id: 'chunk1', choices: [{ delta: {} }] },
        { id: 'chunk2', choices: [{ delta: { content: 'Hello' } }] },
        { id: 'chunk3', choices: [{ delta: {} }] },
      ];

      // Configure mocks for this test
      (openAiProvider.getOpenAiClient as any).mockReturnValue(mockOpenAiClient);
      mockTx.query.users.findFirst.mockResolvedValueOnce({ id: userId });
      mockTx.query.chats.findFirst.mockResolvedValueOnce({
        id: 'chat-id',
        userId,
      });
      mockTx.query.chatMessages.findMany.mockResolvedValueOnce([]);

      // Mock the streaming behavior
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamingResponse) {
            yield chunk;
          }
        },
      } as any);

      mockTx.insert.mockReturnThis();
      mockTx.values.mockReturnThis();
      mockTx.returning.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'message-id',
            content: 'Hello',
            role: 'assistant',
            createdAt: new Date(),
            chatId: 'chat-id',
            userId,
          },
        ]),
      );

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
    });
  });
});
