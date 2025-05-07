import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { users } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

export const PATCH_USER_PROFILE_TOOL_NAME = 'patchUserProfile';

export const profileSchema = z.object({
  name: z.string().optional().describe('User name'),
  age: z.number().int().optional().describe('User age'),
  gender: z.string().optional().describe('User gender'),
  height: z.number().optional().describe('User height in cm'),
  weight: z.number().optional().describe('User weight in kg'),
  work: z.string().optional().describe('User work/occupation'),
  physicalActivity: z
    .string()
    .optional()
    .describe('User physical activity level'),
});

export type ProfileField = z.infer<typeof profileSchema>;

@Injectable()
export class ProfileTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: PATCH_USER_PROFILE_TOOL_NAME,
      description: 'Update user profile fields',
      parameters: zodToJsonSchema(profileSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === PATCH_USER_PROFILE_TOOL_NAME;
  }

  async execute(userId: string, toolCall: ToolCall): Promise<string> {
    const tx = this.txHost.tx;

    try {
      const args = profileSchema.parse(JSON.parse(toolCall.arguments));

      // Get the current profile
      const currentUser = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      const currentProfile = (currentUser?.profile as ProfileField) || {};

      // Merge the new fields with the existing profile
      const updatedProfile = {
        ...currentProfile,
        ...args,
      };

      // Update the profile
      await tx
        .update(users)
        .set({
          profile: updatedProfile,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return JSON.stringify({
        success: true,
        message: 'Profile updated successfully',
        updatedFields: Object.keys(args),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to update profile: ${error.message}`,
      });
    }
  }
}
