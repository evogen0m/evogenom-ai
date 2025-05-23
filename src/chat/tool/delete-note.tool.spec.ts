import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chatNotes, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { DELETE_NOTES_TOOL_NAME, DeleteNoteTool } from './delete-note.tool';
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

  it('should delete a single note', async () => {
    // Create a note to delete
    const noteId = randomUUID();
    await dbClient.insert(chatNotes).values({
      id: noteId,
      chatId: chatId,
      content: 'Note to be deleted',
    });

    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [noteId],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(result.deletedIds).toContain(noteId);
    expect(result.message).toContain('Successfully deleted 1 note(s)');

    // Verify the note is actually deleted from the database
    const deletedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });
    expect(deletedNote).toBeUndefined();
  });

  it('should delete multiple notes', async () => {
    // Create multiple notes to delete
    const noteId1 = randomUUID();
    const noteId2 = randomUUID();
    const noteId3 = randomUUID();

    await dbClient.insert(chatNotes).values([
      { id: noteId1, chatId: chatId, content: 'Note 1 to be deleted' },
      { id: noteId2, chatId: chatId, content: 'Note 2 to be deleted' },
      { id: noteId3, chatId: chatId, content: 'Note 3 to be deleted' },
    ]);

    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [noteId1, noteId2, noteId3],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(3);
    expect(result.deletedIds).toHaveLength(3);
    expect(result.deletedIds).toEqual(
      expect.arrayContaining([noteId1, noteId2, noteId3]),
    );

    // Verify all notes are deleted from the database
    const remainingNotes = await dbClient.query.chatNotes.findMany({
      where: (notes, { eq }) => eq(notes.chatId, chatId),
    });
    expect(remainingNotes).toHaveLength(0);
  });

  it('should handle non-existent note IDs gracefully', async () => {
    const nonExistentNoteId = randomUUID();

    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [nonExistentNoteId],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(0);
    expect(result.deletedIds).toHaveLength(0);
    expect(result.message).toContain('Successfully deleted 0 note(s)');
  });

  it('should handle mix of existing and non-existent note IDs', async () => {
    // Create one note that exists
    const existingNoteId = randomUUID();
    await dbClient.insert(chatNotes).values({
      id: existingNoteId,
      chatId: chatId,
      content: 'Existing note to be deleted',
    });

    const nonExistentNoteId = randomUUID();

    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [existingNoteId, nonExistentNoteId],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(result.deletedIds).toContain(existingNoteId);
    expect(result.deletedIds).not.toContain(nonExistentNoteId);

    // Verify the existing note is deleted
    const deletedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, existingNoteId),
    });
    expect(deletedNote).toBeUndefined();
  });

  it('should return an error for empty noteIds array', async () => {
    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to delete notes');
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

    // Create notes in both chats
    const noteInCurrentChat = randomUUID();
    const noteInOtherChat = randomUUID();

    await dbClient.insert(chatNotes).values([
      {
        id: noteInCurrentChat,
        chatId: chatId,
        content: 'Note in current chat',
      },
      {
        id: noteInOtherChat,
        chatId: otherChatId,
        content: 'Note in other chat',
      },
    ]);

    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: [noteInCurrentChat, noteInOtherChat],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(result.deletedIds).toContain(noteInCurrentChat);
    expect(result.deletedIds).not.toContain(noteInOtherChat);

    // Verify only the note from current chat is deleted
    const noteFromCurrentChat = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteInCurrentChat),
    });
    expect(noteFromCurrentChat).toBeUndefined();

    const noteFromOtherChat = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteInOtherChat),
    });
    expect(noteFromOtherChat).toBeDefined();
  });

  it('should return an error for invalid input (invalid UUID)', async () => {
    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: JSON.stringify({
        noteIds: ['invalid-uuid'],
      }),
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to delete notes');
  });

  it('should return an error for malformed arguments', async () => {
    const toolCall: ToolCall = {
      name: DELETE_NOTES_TOOL_NAME,
      arguments: 'invalid json',
    };

    const resultString = await deleteNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to delete notes');
  });

  it('should validate the tool call correctly', () => {
    expect(
      deleteNoteTool.canExecute({
        name: DELETE_NOTES_TOOL_NAME,
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
