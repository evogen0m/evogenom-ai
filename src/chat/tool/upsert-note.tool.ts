import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { chatNotes } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

export const UPSERT_NOTE_TOOL_NAME = 'upsertNote';

export const upsertNoteSchema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .describe(
      'The ID of the note. If not provided, a new note will be created. If provided and it exists, it will be updated.',
    ),
  content: z.string().min(1).describe('The content of the note.'),
});

export type UpsertNoteField = z.infer<typeof upsertNoteSchema>;

@Injectable()
export class UpsertNoteTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: UPSERT_NOTE_TOOL_NAME,
      description:
        'Create or update a note for the current chat. If an ID is provided and it exists, it will be updated. Otherwise, a new note will be created (with the provided ID if supplied, or a new one if not). Use this tool to keep notes about the user when he reveals relevant information related to his wellbeing or habits. Remember that the notes are private to you, user cannot see them. Try to keep notes short and concise as possible.',
      parameters: zodToJsonSchema(upsertNoteSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === UPSERT_NOTE_TOOL_NAME;
  }

  @Transactional()
  async execute(
    userId: string,
    toolCall: ToolCall,
    chatId: string,
  ): Promise<string> {
    const tx = this.txHost.tx;

    try {
      const args = upsertNoteSchema.parse(JSON.parse(toolCall.arguments));
      const noteId = args.id || randomUUID();

      const existingNote = await tx.query.chatNotes.findFirst({
        where: and(eq(chatNotes.id, noteId), eq(chatNotes.chatId, chatId)),
      });

      if (existingNote) {
        await tx
          .update(chatNotes)
          .set({
            content: args.content,
            updatedAt: new Date(),
          })
          .where(and(eq(chatNotes.id, noteId), eq(chatNotes.chatId, chatId)));

        return JSON.stringify({
          success: true,
          message: 'Note updated successfully.',
          note: { id: noteId, status: 'updated' },
        });
      } else {
        await tx.insert(chatNotes).values({
          id: noteId,
          chatId: chatId,
          content: args.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return JSON.stringify({
          success: true,
          message: 'Note created successfully.',
          note: { id: noteId, status: 'created' },
        });
      }
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to process note: ${error.message}`,
      });
    }
  }
}
