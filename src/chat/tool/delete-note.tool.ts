import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { chatNotes } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

export const DELETE_NOTE_TOOL_NAME = 'deleteNote';

export const deleteNoteSchema = z.object({
  noteId: z.string().uuid().describe('The ID of the note to delete.'),
});

export type DeleteNoteField = z.infer<typeof deleteNoteSchema>;

@Injectable()
export class DeleteNoteTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: DELETE_NOTE_TOOL_NAME,
      description:
        'Delete a note for the current chat by its ID. Use this tool to delete a note that is incorrect or no longer relevant.',
      parameters: zodToJsonSchema(deleteNoteSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === DELETE_NOTE_TOOL_NAME;
  }

  async execute(
    userId: string,
    toolCall: ToolCall,
    chatId: string,
  ): Promise<string> {
    const tx = this.txHost.tx;

    try {
      const args = deleteNoteSchema.parse(JSON.parse(toolCall.arguments));

      const result = await tx
        .delete(chatNotes)
        .where(and(eq(chatNotes.chatId, chatId), eq(chatNotes.id, args.noteId)))
        .returning({ id: chatNotes.id });

      if (result.length > 0) {
        return JSON.stringify({
          success: true,
          message: 'Note deleted successfully.',
          deletedId: result[0].id,
        });
      } else {
        return JSON.stringify({
          success: false,
          message: 'Note not found or could not be deleted.',
        });
      }
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to delete note: ${error.message}`,
      });
    }
  }
}
