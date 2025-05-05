import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte, sql } from 'drizzle-orm';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { followUps } from '../db/schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class FollowUpService implements OnModuleInit {
  private readonly logger = new Logger(FollowUpService.name);
  private static readonly LOCK_ID = 569783; // Arbitrary number for the advisory lock

  constructor(
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    this.logger.log('FollowUp service initialized');
  }

  /**
   * Cron job that runs every minute to check for due follow-ups
   * Uses a PostgreSQL transaction-level advisory lock to prevent duplicate execution in distributed environments
   */
  @Cron(CronExpression.EVERY_MINUTE)
  @Transactional()
  async checkForDueFollowUps() {
    this.logger.debug('Checking for due follow-ups');
    // Try to acquire a transaction-level advisory lock
    const lockResult = await this.acquireAdvisoryLock();

    if (!lockResult) {
      this.logger.debug(
        'Could not acquire advisory lock. Skipping follow-up check.',
      );
      return;
    }

    // Get current time in UTC
    const now = new Date();

    // Find all pending follow-ups that are due
    const dueFollowUps = await this.txHost.tx
      .select()
      .from(followUps)
      .where(and(eq(followUps.status, 'pending'), lte(followUps.dueDate, now)));

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
        await this.txHost.tx
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
        await this.txHost.tx
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
  }

  /**
   * Acquires a PostgreSQL transaction-level advisory lock to ensure only one instance runs the job
   * @param tx The transaction object
   * @returns true if lock was acquired, false otherwise
   */
  private async acquireAdvisoryLock(): Promise<boolean> {
    try {
      // pg_try_advisory_xact_lock returns true if lock was acquired, false otherwise
      const result = await this.txHost.tx.execute<{ acquired: boolean }>(
        sql`SELECT pg_try_advisory_xact_lock(${FollowUpService.LOCK_ID}) as acquired`,
      );
      return result.rows.at(0)?.acquired ?? false;
    } catch (error) {
      this.logger.error(
        'Error acquiring transaction-level advisory lock',
        error.stack,
      );
      return false;
    }
  }
}
