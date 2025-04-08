import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { chatMessages, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { OpenAiProvider } from '../../openai/openai';
import { ChatEventResponse, ChatRequest } from '../dto/chat';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;

  const mockOpenAiClient = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    // Mock OpenAI provider
    openAiProvider = {
      getOpenAiClient: jest.fn().mockReturnValue(mockOpenAiClient),
    } as unknown as OpenAiProvider;

    const module: TestingModule = await createTestingModuleWithDb({
      providers: [
        ChatService,
        {
          provide: OpenAiProvider,
          useValue: openAiProvider,
        },
      ],
    });

    service = module.get<ChatService>(ChatService);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureUserExists', () => {
    it('should create a user if it does not exist', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);

      const result = await dbClient.query.users.findFirst({
        where: eq(users.id, userId),
      });
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(userId);
    });

    it('should not create a duplicate user if it already exists', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);
      await service.ensureUserExists(userId);

      const result = await dbClient.query.users.findFirst({
        where: eq(users.id, userId),
      });
      expect(result).not.toBeNull();
    });
  });

  describe('getOrCreateChat', () => {
    it('should create a new chat for a user', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);

      const chat = await service.getOrCreateChat(userId);
      expect(chat.userId).toEqual(userId);
      expect(chat.id).toBeDefined();

      const result = await dbClient.query.chats.findFirst({
        where: eq(chats.id, chat.id),
      });
      expect(result).not.toBeNull();
    });

    it('should return existing chat if one exists', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);

      const chat1 = await service.getOrCreateChat(userId);
      const chat2 = await service.getOrCreateChat(userId);

      expect(chat1.id).toEqual(chat2.id);
    });
  });

  describe('getMessages', () => {
    it('should return messages for a user', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);
      const chat = await service.getOrCreateChat(userId);

      // Insert test messages directly into the database
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        chatId: chat.id,
        userId,
        role: 'user',
        content: 'Hello',
      });
      await dbClient.insert(chatMessages).values({
        id: randomUUID(),
        chatId: chat.id,
        userId,
        role: 'assistant',
        content: 'Hi there',
      });

      const messages = await service.getMessages(userId);
      expect(messages.length).toEqual(2);
      expect(messages[0].role).toEqual('assistant');
      expect(messages[0].content).toEqual('Hi there');
      expect(messages[1].role).toEqual('user');
      expect(messages[1].content).toEqual('Hello');
    });

    it('should return empty array when no messages exist', async () => {
      const userId = randomUUID();
      await service.ensureUserExists(userId);

      const messages = await service.getMessages(userId);
      expect(messages).toEqual([]);
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
      const streamGenerator = service.createChatStream(request, userId);

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

      // Verify the message was saved to the database
      const messages = await service.getMessages(userId);
      expect(messages.length).toEqual(2);
      expect(messages[0].content).toEqual('Hello world!');
      expect(messages[0].role).toEqual('assistant');
      expect(messages[1].content).toEqual('Hi there');
      expect(messages[1].role).toEqual('user');

      // Verify OpenAI client was called with correct parameters
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Hi there',
          }),
        ]),
        stream: true,
      });
    });

    it('should handle empty chunks correctly', async () => {
      // Setup
      const userId = randomUUID();
      const streamingResponse = [
        { id: 'chunk1', choices: [{ delta: { content: 'Hello' } }] },
        { id: 'chunk2', choices: [{ delta: {} }] }, // Empty content
        { id: 'chunk3', choices: [{ delta: { content: ' world!' } }] },
      ];

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
      const streamGenerator = service.createChatStream(request, userId);

      // Collect all streamed events
      const events: ChatEventResponse[] = [];
      for await (const event of streamGenerator) {
        events.push(event);
      }

      // Verify the stream events - should skip the empty chunk
      expect(events.length).toEqual(3); // 2 chunks + 1 final message

      // Check chunks
      expect(events[0].event).toEqual('chunk');
      expect((events[0] as any).chunk).toEqual('Hello');
      expect(events[1].event).toEqual('chunk');
      expect((events[1] as any).chunk).toEqual(' world!');

      // Check final message
      expect(events[2].event).toEqual('message');
      expect((events[2] as any).content).toEqual('Hello world!');
    });
  });
});
