import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { followUps } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

const CANCEL_FOLLOWUP_TOOL_NAME = 'cancel_followup';

const cancelFollowupSchema = z.object({
  followupId: z.string().describe('The ID of the follow-up to cancel'),
});

@Injectable()
export class CancelFollowupTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  private readonly logger = new Logger(CancelFollowupTool.name);

  @Transactional()
  async execute(userId: string, input: ToolCall): Promise<string> {
    try {
      const args = cancelFollowupSchema.parse(JSON.parse(input.arguments));

      // Find the follow-up and check if it belongs to the user
      const followup = await this.txHost.tx
        .select()
        .from(followUps)
        .where(eq(followUps.id, args.followupId))
        .limit(1);

      if (!followup || followup.length === 0) {
        return `Follow-up with ID ${args.followupId} not found.`;
      }

      if (followup[0].userId !== userId) {
        return `You don't have permission to cancel this follow-up.`;
      }

      // Check if it's already cancelled
      if (followup[0].status === 'cancelled') {
        return `This follow-up has already been cancelled.`;
      }

      // Cancel the follow-up
      await this.txHost.tx
        .update(followUps)
        .set({ status: 'cancelled' })
        .where(eq(followUps.id, args.followupId));

      return `Follow-up cancelled successfully.`;
    } catch (error) {
      this.logger.error('Error cancelling follow-up:', error);
      return `Error cancelling follow-up: ${error.message}`;
    }
  }

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: CANCEL_FOLLOWUP_TOOL_NAME,
      description: 'Cancel an existing follow-up reminder',
      parameters: zodToJsonSchema(cancelFollowupSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === CANCEL_FOLLOWUP_TOOL_NAME;
  }
}
