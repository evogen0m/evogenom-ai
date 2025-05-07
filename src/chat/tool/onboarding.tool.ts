import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { users } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

export const COMPLETE_ONBOARDING_TOOL_NAME = 'completeOnboarding';

const completeOnboardingSchema = z.object({
  // Empty object as this tool doesn't require any parameters
});

@Injectable()
export class OnboardingTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: COMPLETE_ONBOARDING_TOOL_NAME,
      description: 'Mark user onboarding as complete',
      parameters: zodToJsonSchema(completeOnboardingSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === COMPLETE_ONBOARDING_TOOL_NAME;
  }

  async execute(userId: string, toolCall: ToolCall): Promise<string> {
    const tx = this.txHost.tx;

    try {
      // Parse arguments (empty in this case)
      completeOnboardingSchema.parse(JSON.parse(toolCall.arguments));

      // Update the user to mark onboarding as complete
      await tx
        .update(users)
        .set({
          isOnboarded: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return JSON.stringify({
        success: true,
        message: 'Onboarding marked as complete',
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to complete onboarding: ${error.message}`,
      });
    }
  }
}
