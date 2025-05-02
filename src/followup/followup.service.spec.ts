/* eslint-disable @typescript-eslint/unbound-method */
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingModuleWithDb } from '../../test/utils';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from '../db/drizzle.provider';
import { chats, followUps, users } from '../db/schema';
import { NotificationService } from '../notification/notification.service';
import { FollowUpService } from './followup.service';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let notificationService: NotificationService;
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
      ],
    }).compile();

    service = module.get<FollowUpService>(FollowUpService);
    notificationService = module.get<NotificationService>(NotificationService);
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
    it('should process due follow-ups', async () => {
      // Insert test follow-up directly into database
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

      // Verify the follow-up was inserted correctly
      const insertedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(insertedFollowUp.length).toBe(1);
      expect(insertedFollowUp[0].status).toBe('pending');

      // Mock the advisory lock to always succeed for this test
      vi.spyOn(service as any, 'acquireAdvisoryLock').mockResolvedValue(true);
      vi.spyOn(service as any, 'releaseAdvisoryLock').mockResolvedValue(
        undefined,
      );

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the notification was sent
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        mockUserId,
        {
          title: 'Evogenom wellness coach',
          body: 'Test follow-up content',
        },
      );

      // Verify the follow-up was updated to 'sent'
      const updatedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(updatedFollowUp[0].status).toBe('sent');
    });

    it('should mark follow-up as failed if notification fails', async () => {
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

      // Mock notification service to throw an error
      vi.spyOn(notificationService, 'sendNotification').mockRejectedValueOnce(
        new Error('Test error'),
      );

      // Mock locks
      vi.spyOn(service as any, 'acquireAdvisoryLock').mockResolvedValue(true);
      vi.spyOn(service as any, 'releaseAdvisoryLock').mockResolvedValue(
        undefined,
      );

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the follow-up was updated to 'failed'
      const updatedFollowUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(updatedFollowUp[0].status).toBe('failed');
    });

    it('should not process follow-ups if unable to acquire lock', async () => {
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

      // Mock acquireAdvisoryLock to return false (couldn't acquire lock)
      vi.spyOn(service as any, 'acquireAdvisoryLock').mockResolvedValue(false);

      // Run the check
      await service.checkForDueFollowUps();

      // Verify notification was not sent
      expect(notificationService.sendNotification).not.toHaveBeenCalled();

      // Verify the follow-up was not updated (still pending)
      const followUp = await db
        .select()
        .from(followUps)
        .where(eq(followUps.id, mockFollowUpId));

      expect(followUp[0].status).toBe('pending');
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

      // Mock lock management
      vi.spyOn(service as any, 'acquireAdvisoryLock').mockResolvedValue(true);
      vi.spyOn(service as any, 'releaseAdvisoryLock').mockResolvedValue(
        undefined,
      );

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

    it('should test the advisory lock functions are called', async () => {
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

      // Spy on the advisory lock methods
      const acquireLockSpy = vi
        .spyOn(service as any, 'acquireAdvisoryLock')
        .mockResolvedValue(true);
      const releaseLockSpy = vi
        .spyOn(service as any, 'releaseAdvisoryLock')
        .mockResolvedValue(undefined);

      // Run the check
      await service.checkForDueFollowUps();

      // Verify the lock methods were called
      expect(acquireLockSpy).toHaveBeenCalled();
      expect(releaseLockSpy).toHaveBeenCalled();

      // Verify the notification was sent (since lock was acquired successfully)
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
});
