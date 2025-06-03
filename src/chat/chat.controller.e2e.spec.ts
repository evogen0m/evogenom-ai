import { INestApplication, ValidationPipe } from '@nestjs/common';
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

    // Setup a more generic/default mock for getMessagesForUi here
    // This will be used if a test doesn't override with mockResolvedValueOnce
    const defaultMockMessages: ChatMessageResponse[] = [
      {
        id: 'default-msg-1',
        content: 'Default message 1',
        role: 'assistant',
        createdAt: new Date(),
      },
    ];
    chatService.getMessagesForUi.mockResolvedValue({
      items: defaultMockMessages,
      total: defaultMockMessages.length, // e.g., 1
      page: 0,
      pageSize: 10, // Reflecting a common default
    });

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
    // Enable validation and transformation for DTOs
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
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
    it('should return all messages for the user with pagination info', async () => {
      // Specific mock for this test case, placed before the request
      const mockItemsForDefaultCall: ChatMessageResponse[] = [
        {
          id: 'message-1-default',
          content: 'Default Page Content 1',
          role: 'assistant',
          createdAt: new Date(),
        },
        {
          id: 'message-2-default',
          content: 'Default Page Content 2',
          role: 'assistant',
          createdAt: new Date(),
        },
      ];
      const expectedDefaultPageSize = 10;
      const mockTotalForDefault = 25;

      chatService.getMessagesForUi.mockResolvedValueOnce({
        items: mockItemsForDefaultCall,
        total: mockTotalForDefault,
        page: 0,
        pageSize: expectedDefaultPageSize,
      });

      // Make the request without query parameters (should use defaults)
      const response = await request(app.getHttpServer())
        .get('/api/chat/messages')
        .expect(200);

      // Verify the service was called correctly with default pagination parameters
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getMessagesForUi).toHaveBeenCalledWith(
        mockUser.id,
        0, // Default page from PagedQuery
        10, // Default pageSize from PagedQuery
      );

      expect(response.body).toEqual(
        expect.objectContaining({
          items: mockItemsForDefaultCall.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(), // Compare with ISO string
          })),
          page: 0,
          pageSize: expectedDefaultPageSize,
          total: mockTotalForDefault,
        }),
      );
      // expect(response.body.items.length).toBeLessThanOrEqual(expectedDefaultPageSize); // This is implicitly covered by the items match
    });

    it('should respect page and pageSize query parameters', async () => {
      const page = 1;
      const pageSize = 5;

      const specificMockMessages: ChatMessageResponse[] = Array.from(
        { length: pageSize },
        (_, i) => ({
          id: `message-page-${page}-item-${i}`,
          content: `Content for page ${page}, item ${i}`,
          role: 'assistant',
          createdAt: new Date(),
        }),
      );
      const mockTotal = 20;

      // Specific mock for this test case, placed before the request
      chatService.getMessagesForUi.mockResolvedValueOnce({
        items: specificMockMessages,
        total: mockTotal,
        page: page,
        pageSize: pageSize,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/chat/messages?page=${page}&pageSize=${pageSize}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(chatService.getMessagesForUi).toHaveBeenCalledWith(
        mockUser.id,
        page,
        pageSize,
      );

      expect(response.body).toEqual({
        items: specificMockMessages.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt.toISOString(), // Compare with ISO string
        })),
        total: mockTotal,
        page: page,
        pageSize: pageSize,
      });
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
