/* eslint-disable @typescript-eslint/unbound-method */
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingModuleWithDb } from '../../test/utils';
import { ChatService } from '../chat/chat/chat.service';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from '../db/drizzle.provider';
import { chats, followUps, users } from '../db/schema';
import { NotificationService } from '../notification/notification.service';
import { FollowUpService } from './followup.service';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let notificationService: NotificationService;
  let chatService: ChatService;
  let db: DrizzleInstanceType;

  // Test data
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockChatId = '123e4567-e89b-12d3-a456-426614174002';
  const mockFollowUpId = '123e4567-e89b-12d3-a456-426614174003';

  // Clean up the test data before and after tests
  const setupTestData = async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Create user
    await db.insert(users).values({
      id: mockUserId,
      timeZone: 'Europe/Helsinki',
    });

    // Create chat
    await db.insert(chats).values({
      id: mockChatId,
      userId: mockUserId,
    });
  };

  const cleanupTestData = async () => {
    // Delete in reverse order due to foreign key constraints
    await db.delete(followUps).where(eq(followUps.id, mockFollowUpId));
    await db.delete(chats).where(eq(chats.id, mockChatId));
    await db.delete(users).where(eq(users.id, mockUserId));
  };

  beforeEach(async () => {
    // Create module with real database
    const module = await createTestingModuleWithDb({
      providers: [
        FollowUpService,
        {
          provide: NotificationService,
          useValue: {
            sendNotification: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ChatService,
          useValue: {
            createAssistantMessage: vi.fn().mockResolvedValue({
              id: 'mock-message-id',
              content: 'Mock content',
              role: 'assistant',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FollowUpService>(FollowUpService);
    notificationService = module.get<NotificationService>(NotificationService);
    chatService = module.get<ChatService>(ChatService);
    db = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Set up test data
    await setupTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
    vi.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkForDueFollowUps', () => {
    it('should process due follow-ups and add them as assistant messages', async () => {
      // Insert test follow-up directly into database
      const now = new Date();
      const pastDue = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
      const followUpContent = 'Test follow-up content';

      await db.insert(followUps).values({
        id: mockFollowUpId,
        userId: mockUserId,
        chatId: mockChatId,
        content: followUpContent,
        dueDate: pastDue,
        status: 'pending',
      });

      // Verify the follow-up was inserted correctly
      const insertedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(insertedFollowUp.length).toBe(1);
      expect(insertedFollowUp[0].status).toBe('pending');

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the notification was sent
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        mockUserId,
        {
          title: 'Evogenom wellness coach',
          body: followUpContent,
        },
      );

      // Verify the follow-up was updated to 'sent'
      const updatedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(updatedFollowUp[0].status).toBe('sent');

      // Verify assistant message was created for the follow-up
      expect(chatService.createAssistantMessage).toHaveBeenCalledWith(
        mockUserId,
        followUpContent,
      );
    });

    it('should mark follow-up as failed if notification fails and not create assistant message', async () => {
      // Insert test follow-up
      const now = new Date();
      const pastDue = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
      const followUpContent = 'Test follow-up content';

      await db.insert(followUps).values({
        id: mockFollowUpId,
        userId: mockUserId,
        chatId: mockChatId,
        content: followUpContent,
        dueDate: pastDue,
        status: 'pending',
      });

      // Mock notification service to throw an error
      vi.spyOn(notificationService, 'sendNotification').mockRejectedValueOnce(
        new Error('Test error'),
      );

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the follow-up was updated to 'failed'
      const updatedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(updatedFollowUp[0].status).toBe('failed');

      // Verify assistant message was NOT created (because notification failed)
      expect(chatService.createAssistantMessage).not.toHaveBeenCalled();
    });

    it('should only process follow-ups that are due', async () => {
      // Insert test follow-up that is in the future
      const now = new Date();
      const future = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes in the future

      await db.insert(followUps).values({
        id: mockFollowUpId,
        userId: mockUserId,
        chatId: mockChatId,
        content: 'Future follow-up',
        dueDate: future,
        status: 'pending',
      });

      // Run the check
      await service.checkForDueFollowUps();

      // Verify notification was not sent (follow-up is in the future)
      expect(notificationService.sendNotification).not.toHaveBeenCalled();

      // Verify the follow-up was not updated (still pending)
      const followUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(followUp[0].status).toBe('pending');
    });

    it('should use database transaction for processing follow-ups', async () => {
      // Insert test follow-up
      const now = new Date();
      const pastDue = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

      await db.insert(followUps).values({
        id: mockFollowUpId,
        userId: mockUserId,
        chatId: mockChatId,
        content: 'Test follow-up content',
        dueDate: pastDue,
        status: 'pending',
      });

      // Spy on the database transaction
      const transactionSpy = vi.spyOn(db, 'transaction');

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the transaction was called
      expect(transactionSpy).toHaveBeenCalled();

      // Verify the notification was sent
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
});
