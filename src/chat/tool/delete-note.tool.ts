import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { chatNotes } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

export const DELETE_NOTES_TOOL_NAME = 'deleteNotes';

export const deleteNotesSchema = z.object({
  noteIds: z
    .array(z.string().uuid())
    .min(1)
    .describe('An array of note IDs to delete.'),
});

export type DeleteNotesField = z.infer<typeof deleteNotesSchema>;

@Injectable()
export class DeleteNoteTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: DELETE_NOTES_TOOL_NAME,
      description:
        'Delete one or more notes for the current chat by their IDs.',
      parameters: zodToJsonSchema(deleteNotesSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === DELETE_NOTES_TOOL_NAME;
  }

  async execute(
    userId: string,
    toolCall: ToolCall,
    chatId: string,
  ): Promise<string> {
    const tx = this.txHost.tx;

    try {
      const args = deleteNotesSchema.parse(JSON.parse(toolCall.arguments));

      if (args.noteIds.length === 0) {
        return JSON.stringify({
          success: true,
          message: 'No note IDs provided for deletion.',
          deletedCount: 0,
        });
      }

      const result = await tx
        .delete(chatNotes)
        .where(
          and(
            eq(chatNotes.chatId, chatId),
            inArray(chatNotes.id, args.noteIds),
          ),
        )
        .returning({ id: chatNotes.id });

      return JSON.stringify({
        success: true,
        message: `Successfully deleted ${result.length} note(s).`,
        deletedCount: result.length,
        deletedIds: result.map((r) => r.id),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to delete notes: ${error.message}`,
      });
    }
  }
}
