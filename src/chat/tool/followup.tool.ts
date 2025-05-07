import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import * as dateFnsTz from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { chats, followUps, users } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

const FOLLOWUP_TOOL_NAME = 'create_followup';

const followupSchema = z.object({
  content: z
    .string()
    .describe('The content of the follow-up reminder, max 160 characters')
    .max(160),
  date: z
    .string()
    .describe('The date for the follow-up in ISO format (YYYY-MM-DD)'),
  time: z
    .string()
    .describe('The time for the follow-up in 24-hour format (HH:MM)'),
});

@Injectable()
export class FollowupTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  private readonly logger = new Logger(FollowupTool.name);

  @Transactional()
  async execute(userId: string, input: ToolCall): Promise<string> {
    try {
      const args = followupSchema.parse(JSON.parse(input.arguments));

      // Get the chat ID for this user (assuming there's only one active chat)
      const chatId = await this._getUserChatId(userId);
      if (!chatId) {
        return 'No chat found to create a follow-up for.';
      }

      // Get user's timezone
      const user = await this.txHost.tx
        .select({ timeZone: users.timeZone })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        return 'User not found.';
      }

      const timeZone = user[0].timeZone;

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(args.date)) {
        return `Invalid date format: ${args.date}. Please use ISO format (YYYY-MM-DD).`;
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(args.time)) {
        return `Invalid time format: ${args.time}. Please use 24-hour format (HH:MM).`;
      }

      // Combine date and time
      const dateTimeString = `${args.date}T${args.time}:00`;

      try {
        // Create a date object in the user's timezone
        const zonedDate = new Date(dateTimeString);

        // Convert the zoned date to a UTC date using toZonedTime
        const dueDate = dateFnsTz.fromZonedTime(zonedDate, timeZone);

        // Insert the follow-up
        await this.txHost.tx.insert(followUps).values({
          userId,
          chatId,
          content: args.content,
          dueDate,
          status: 'pending',
        });

        return `Follow-up scheduled successfully for ${args.date} at ${args.time} (${timeZone}).`;
      } catch (error) {
        this.logger.error('Error processing date/time:', error);
        return `Invalid date/time combination: ${args.date} ${args.time}.`;
      }
    } catch (error) {
      this.logger.error('Error creating follow-up:', error);
      return `Error creating follow-up: ${error.message}`;
    }
  }

  private async _getUserChatId(userId: string): Promise<string | null> {
    // Get the first chat for this user - assuming one active chat per user
    const chatResult = await this.txHost.tx
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.userId, userId))
      .limit(1);

    return chatResult.length > 0 ? chatResult[0].id : null;
  }

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: FOLLOWUP_TOOL_NAME,
      description:
        'Create a follow-up reminder to check back with the user at a specified date and time',
      parameters: zodToJsonSchema(followupSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === FOLLOWUP_TOOL_NAME;
  }
}
