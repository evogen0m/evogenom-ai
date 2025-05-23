import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chatNotes, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { DELETE_NOTE_TOOL_NAME, DeleteNoteTool } from './delete-note.tool';
import { ToolCall } from './tool';

describe('DeleteNoteTool', () => {
  let deleteNoteTool: DeleteNoteTool;
  let dbClient: DrizzleInstanceType;
  let userId: string;
  let chatId: string;

  beforeEach(async () => {
    const moduleBuilder = createTestingModuleWithDb({
      providers: [DeleteNoteTool],
    });

    const module = await moduleBuilder.compile();

    deleteNoteTool = module.get<DeleteNoteTool>(DeleteNoteTool);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE chat_note CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE chat CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);

    // Generate a test user ID and create user
    userId = randomUUID();
    await dbClient.insert(users).values({
      id: userId,
      timeZone: 'Europe/Helsinki',
    });

    // Create a chat for the user
    chatId = randomUUID();
    await dbClient.insert(chats).values({
      id: chatId,
      userId: userId,
    });
  });

  it('should be defined', () => {
    expect(deleteNoteTool).toBeDefined();
  });

  it('should delete a note successfully', async () => {
    // Create a note to delete
    const noteId = randomUUID();
    await dbClient.insert(chatNotes).values({
      id: noteId,
      chatId: chatId,
      content: 'Note to be deleted',
    });

    const toolCall: ToolCall = {
      name: DELETE_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        noteId: noteId,
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedId).toBe(noteId);
    expect(result.message).toBe('Note deleted successfully.');

    // Verify the note is actually deleted from the database
    const deletedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });
    expect(deletedNote).toBeUndefined();
  });

  it('should handle non-existent note ID gracefully', async () => {
    const nonExistentNoteId = randomUUID();

    const toolCall: ToolCall = {
      name: DELETE_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        noteId: nonExistentNoteId,
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Note not found or could not be deleted.');
  });

  it('should only delete notes from the current chat', async () => {
    // Create another chat and user
    const otherUserId = randomUUID();
    await dbClient.insert(users).values({
      id: otherUserId,
      timeZone: 'Europe/Helsinki',
    });

    const otherChatId = randomUUID();
    await dbClient.insert(chats).values({
      id: otherChatId,
      userId: otherUserId,
    });

    // Create notes in both chats with the same ID (this would be unusual but tests the chatId filtering)
    const noteId = randomUUID();
    const noteInOtherChat = randomUUID();

    await dbClient.insert(chatNotes).values([
      {
        id: noteId,
        chatId: chatId,
        content: 'Note in current chat',
      },
      {
        id: noteInOtherChat,
        chatId: otherChatId,
        content: 'Note in other chat',
      },
    ]);

    // Try to delete the note from the other chat using current chatId
    const toolCall: ToolCall = {
      name: DELETE_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        noteId: noteInOtherChat,
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Note not found or could not be deleted.');

    // Verify the note from other chat still exists
    const noteFromOtherChat = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteInOtherChat),
    });
    expect(noteFromOtherChat).toBeDefined();

    // Verify the note from current chat still exists
    const noteFromCurrentChat = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });
    expect(noteFromCurrentChat).toBeDefined();
  });

  it('should return an error for invalid input (invalid UUID)', async () => {
    const toolCall: ToolCall = {
      name: DELETE_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        noteId: 'invalid-uuid',
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to delete note');
  });

  it('should return an error for malformed arguments', async () => {
    const toolCall: ToolCall = {
      name: DELETE_NOTE_TOOL_NAME,
      arguments: 'invalid json',
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to delete note');
  });

  it('should validate the tool call correctly', () => {
    expect(
      deleteNoteTool.canExecute({
        name: DELETE_NOTE_TOOL_NAME,
        arguments: '{}',
      }),
    ).toBe(true);

    expect(
      deleteNoteTool.canExecute({
        name: 'other_tool',
        arguments: '{}',
      }),
    ).toBe(false);
  });
});
