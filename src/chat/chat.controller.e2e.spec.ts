import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventSource } from 'eventsource';
import { mockDeep } from 'jest-mock-extended';
import { AuthGuard } from 'src/auth/auth/auth.guard';
import { UserPrincipal } from 'src/auth/UserPrincipal';
import * as request from 'supertest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat/chat.service';
import {
  ChatChunkEventResponse,
  ChatMessageEventResponse,
  ChatMessageResponse,
} from './dto/chat';

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let chatService: ChatService;

  const mockUser: UserPrincipal = {
    id: 'test-user-id',
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    }),
  };

  beforeEach(async () => {
    chatService = mockDeep<ChatService>();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: chatService,
        },
      ],
    })
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
      // Mock chat service to return stream of events
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

      // Setup the mock to return an async generator
      const mockAsyncGenerator = async function* () {
        yield mockChunkEvent;
        yield mockMessageEvent;
      };

      (chatService.createChatStream as jest.Mock).mockImplementation(() =>
        mockAsyncGenerator(),
      );

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
      // Mock data
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

      // Setup the mock
      (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      // Make the request
      const response = await request(app.getHttpServer())
        .get('/api/chat/messages')
        .expect(200);

      // Verify the service was called correctly
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getMessages).toHaveBeenCalledWith(mockUser.id);

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
});
