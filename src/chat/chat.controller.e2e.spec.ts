import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { EventSource } from 'eventsource';
import { AuthGuard } from 'src/auth/auth/auth.guard';
import { UserPrincipal } from 'src/auth/UserPrincipal';
import request from 'supertest';
import { createTestingModuleWithDb } from 'test/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { ChatModule } from './chat.module';
import { ChatService } from './chat/chat.service';
import {
  ChatChunkEventResponse,
  ChatMessageEventResponse,
  ChatMessageResponse,
} from './dto/chat';

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let chatService: DeepMockProxy<ChatService>;

  const mockUser: UserPrincipal = {
    id: 'test-user-id',
    evogenomApiToken: 'test-token',
  };

  const mockAuthGuard = {
    canActivate: vi.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    }),
  };

  beforeEach(async () => {
    chatService = mockDeep<ChatService>();

    // Configure mocks BEFORE app init
    // Setup the mock for createChatStream
    const mockChunkEvent: ChatChunkEventResponse = {
      id: 'chunk-1',
      chunk: 'Hello',
      event: 'chunk',
    };
    const mockMessageEvent: ChatMessageEventResponse = {
      id: 'message-1',
      content: 'Hello world',
      role: 'assistant',
      createdAt: new Date(),
      event: 'message',
    };
    const mockAsyncGenerator = async function* () {
      yield mockChunkEvent;
      yield mockMessageEvent;
    };
    chatService.createChatStream.mockImplementation(() => mockAsyncGenerator());

    // Setup the mock for getMessages
    const mockMessages: ChatMessageResponse[] = [
      {
        id: 'message-1',
        content: 'Hello world',
        role: 'assistant',
        createdAt: new Date(),
      },
      {
        id: 'message-2',
        content: 'How can I help?',
        role: 'assistant',
        createdAt: new Date(),
      },
    ];
    chatService.getMessagesForUi.mockResolvedValue(mockMessages);

    // Setup the mock for getCurrentWellnessPlan
    const mockWellnessPlan =
      '## Wellness Plan\n\n- Drink more water\n- Exercise daily';
    chatService.getCurrentWellnessPlan.mockResolvedValue(mockWellnessPlan);

    // Setup the mock for getQuickResponses
    const mockQuickResponses = {
      quickResponses: [
        { text: 'That sounds great!' },
        { text: 'Tell me more' },
        { text: 'I need help' },
        { text: 'Thanks!' },
      ],
    };
    chatService.getQuickResponses.mockResolvedValue(mockQuickResponses);

    const moduleFixture: TestingModule = await createTestingModuleWithDb({
      imports: [ChatModule],
    })
      .overrideProvider(ChatService)
      .useValue(chatService)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('when getting chat events from SSE endpoint', () => {
    let server: ReturnType<INestApplication['getHttpServer']>;
    beforeEach(() => {
      server = app.getHttpServer();
      server.listen(0);
    });

    afterEach(async () => {
      await server.close();
    });

    it('should stream chat events back', async () => {
      const baseUrl = `http://127.0.0.1:${server.address().port}`;

      const receivedEvents: any[] = [];

      // Using EventSource from the eventsource library
      return new Promise<void>((resolve, reject) => {
        // Create headers for GET request
        const headers = {
          Accept: 'text/event-stream',
        };

        // Create EventSource with custom fetch implementation
        const es = new EventSource(`${baseUrl}/api/chat/sse?content=Hello`, {
          fetch: (input, init) => {
            return fetch(input, {
              ...init,
              method: 'GET',
              headers: { ...headers, ...init?.headers },
            });
          },
        });

        // Since all events are now 'message' events, we only need to listen for them
        es.addEventListener('message', (event) => {
          const parsedData = JSON.parse(event.data);
          receivedEvents.push(parsedData);
        });

        // Handle the connection closing naturally when the server completes the stream
        es.addEventListener('close', () => {
          // Verify we received all expected events
          expect(receivedEvents.length).toBe(2);

          // Validate first event (chunk type)
          expect(receivedEvents[0]).toEqual(
            expect.objectContaining({
              id: 'chunk-1',
              chunk: 'Hello',
              event: 'chunk',
            }),
          );

          // Validate second event (message type)
          expect(receivedEvents[1]).toEqual(
            expect.objectContaining({
              id: 'message-1',
              content: 'Hello world',
              role: 'assistant',
              event: 'message',
            }),
          );

          resolve();
        });

        // Handle errors
        es.addEventListener('error', (err) => {
          // When a stream is closed normally, it triggers an error event with status code 0 or no status
          // The EventSource library error object doesn't have a standard structure
          // So we check if all events were received before closing
          if (receivedEvents.length >= 2) {
            resolve();
          } else {
            reject(
              new Error(`EventSource error: ${err.message || 'Unknown error'}`),
            );
          }
        });
      });
    });
  });

  describe('when getting chat messages', () => {
    it('should return all messages for the user', async () => {
      // Make the request
      const response = await request(app.getHttpServer())
        .get('/api/chat/messages')
        .expect(200);

      // Verify the service was called correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getMessagesForUi).toHaveBeenCalledWith(mockUser.id);

      // Verify the response body
      expect(response.body).toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 'message-1',
              content: 'Hello world',
              role: 'assistant',
            }),
            expect.objectContaining({
              id: 'message-2',
              content: 'How can I help?',
              role: 'assistant',
            }),
          ]),
          page: 0,
          pageSize: 2,
          total: 2,
        }),
      );
    });
  });

  describe('when getting the wellness plan', () => {
    it('should return the wellness plan for the user', async () => {
      // Make the request
      const response = await request(app.getHttpServer())
        .get('/api/chat/wellness-plan')
        .expect(200);

      // Verify the service was called correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getCurrentWellnessPlan).toHaveBeenCalledWith(
        mockUser.id,
      );

      // Verify the response body
      expect(response.body).toEqual({
        wellnessPlan:
          '## Wellness Plan\n\n- Drink more water\n- Exercise daily',
      });
    });
  });

  describe('when getting quick responses', () => {
    it('should return quick response options for the user', async () => {
      // Make the request
      const response = await request(app.getHttpServer())
        .get('/api/chat/quick-responses')
        .expect(200);

      // Verify the service was called correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getQuickResponses).toHaveBeenCalledWith(mockUser.id);

      // Verify the response body
      expect(response.body).toEqual({
        quickResponses: [
          { text: 'That sounds great!' },
          { text: 'Tell me more' },
          { text: 'I need help' },
          { text: 'Thanks!' },
        ],
      });
    });
  });
});
