import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from '../db/drizzle.provider';
import { followUps } from '../db/schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class FollowUpService implements OnModuleInit {
  private readonly logger = new Logger(FollowUpService.name);
  private static readonly LOCK_ID = 100001; // Arbitrary number for the advisory lock

  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleInstanceType,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    this.logger.log('FollowUp service initialized');
  }

  /**
   * Cron job that runs every minute to check for due follow-ups
   * Uses a PostgreSQL advisory lock to prevent duplicate execution in distributed environments
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkForDueFollowUps() {
    this.logger.debug('Checking for due follow-ups');

    // Try to acquire an advisory lock
    const lockResult = await this.acquireAdvisoryLock();

    if (!lockResult) {
      this.logger.debug(
        'Could not acquire advisory lock. Skipping follow-up check.',
      );
      return;
    }

    try {
      // Get current time in UTC
      const now = new Date();

      // Find all pending follow-ups that are due
      const dueFollowUps = await this.db
        .select()
        .from(followUps)
        .where(
          and(eq(followUps.status, 'pending'), lte(followUps.dueDate, now)),
        );

      this.logger.debug(`Found ${dueFollowUps.length} due follow-ups`);

      // Process each due follow-up
      for (const followUp of dueFollowUps) {
        try {
          // Send notification
          await this.notificationService.sendNotification(followUp.userId, {
            title: 'Evogenom wellness coach',
            body: followUp.content,
          });

          // Update follow-up status to 'sent'
          await this.db
            .update(followUps)
            .set({
              status: 'sent',
              updatedAt: new Date(),
            })
            .where(eq(followUps.id, followUp.id));

          this.logger.debug(
            `Follow-up ${followUp.id} notification sent successfully`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process follow-up ${followUp.id}`,
            error.stack,
          );

          // Update follow-up status to 'failed'
          await this.db
            .update(followUps)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(followUps.id, followUp.id));

          this.logger.debug(
            `Follow-up ${followUp.id} status updated to 'failed'`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error checking for due follow-ups', error.stack);
    } finally {
      // Always release the lock
      await this.releaseAdvisoryLock();
    }
  }

  /**
   * Acquires a PostgreSQL advisory lock to ensure only one instance runs the job
   * @returns true if lock was acquired, false otherwise
   */
  private async acquireAdvisoryLock(): Promise<boolean> {
    try {
      // pg_try_advisory_lock returns true if lock was acquired, false otherwise
      const result = await this.db.execute(
        `SELECT pg_try_advisory_lock(${FollowUpService.LOCK_ID}) as acquired`,
      );
      return result[0]?.acquired === true;
    } catch (error) {
      this.logger.error('Error acquiring advisory lock', error.stack);
      return false;
    }
  }

  /**
   * Releases the PostgreSQL advisory lock
   */
  private async releaseAdvisoryLock(): Promise<void> {
    try {
      await this.db.execute(
        `SELECT pg_advisory_unlock(${FollowUpService.LOCK_ID})`,
      );
    } catch (error) {
      this.logger.error('Error releasing advisory lock', error.stack);
    }
  }
}
