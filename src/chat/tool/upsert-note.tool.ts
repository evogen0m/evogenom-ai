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

export const UPSERT_NOTES_TOOL_NAME = 'upsertNotes';

const individualNoteSchema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .describe(
      'The ID of the note. If not provided, a new note will be created. If provided and it exists, it will be updated.',
    ),
  content: z.string().min(1).describe('The content of the note.'),
});

export const upsertNotesSchema = z.object({
  notes: z
    .array(individualNoteSchema)
    .min(1)
    .describe('An array of notes to create or update.'),
});

export type UpsertNotesField = z.infer<typeof upsertNotesSchema>;

@Injectable()
export class UpsertNoteTool implements Tool {
  constructor(private readonly txHost: TransactionHost<DbTransactionAdapter>) {}

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: UPSERT_NOTES_TOOL_NAME,
      description:
        'Create or update one or more notes for the current chat. For each note, if an ID is provided and it exists, it will be updated. Otherwise, a new note will be created (with the provided ID if supplied, or a new one if not).',
      parameters: zodToJsonSchema(upsertNotesSchema),
    },
  } as const;

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === UPSERT_NOTES_TOOL_NAME;
  }

  @Transactional()
  async execute(
    userId: string,
    toolCall: ToolCall,
    chatId: string,
  ): Promise<string> {
    const tx = this.txHost.tx;
    const results: Array<{ id: string; status: string; message?: string }> = [];

    try {
      const args = upsertNotesSchema.parse(JSON.parse(toolCall.arguments));

      for (const noteItem of args.notes) {
        const noteId = noteItem.id || randomUUID();
        try {
          const existingNote = await tx.query.chatNotes.findFirst({
            where: and(eq(chatNotes.id, noteId), eq(chatNotes.chatId, chatId)),
          });

          if (existingNote) {
            await tx
              .update(chatNotes)
              .set({
                content: noteItem.content,
                updatedAt: new Date(),
              })
              .where(
                and(eq(chatNotes.id, noteId), eq(chatNotes.chatId, chatId)),
              );
            results.push({ id: noteId, status: 'updated' });
          } else {
            await tx.insert(chatNotes).values({
              id: noteId,
              chatId: chatId,
              content: noteItem.content,
              createdAt: new Date(), // Explicitly set createdAt for new notes
              updatedAt: new Date(),
            });
            results.push({ id: noteId, status: 'created' });
          }
        } catch (itemError) {
          results.push({
            id: noteItem.id || 'unknown_id_on_error',
            status: 'error',
            message:
              itemError instanceof Error
                ? itemError.message
                : String(itemError),
          });
        }
      }

      return JSON.stringify({
        success: true,
        message: 'Note operations attempted.',
        results,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: `Failed to process notes: ${error.message}`,
        results,
      });
    }
  }
}
