import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chatNotes, chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolCall } from './tool';
import { UPSERT_NOTE_TOOL_NAME, UpsertNoteTool } from './upsert-note.tool';

describe('UpsertNoteTool', () => {
  let upsertNoteTool: UpsertNoteTool;
  let dbClient: DrizzleInstanceType;
  let userId: string;
  let chatId: string;

  beforeEach(async () => {
    const moduleBuilder = createTestingModuleWithDb({
      providers: [UpsertNoteTool],
    });

    const module = await moduleBuilder.compile();

    upsertNoteTool = module.get<UpsertNoteTool>(UpsertNoteTool);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE chat_note CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE chat CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);

    // Generate a test user ID and create user
    userId = randomUUID();
    await dbClient.insert(users).values({
      id: userId,
      timeZone: 'Europe/Helsinki', // Or any valid timezone
    });

    // Create a chat for the user
    chatId = randomUUID();
    await dbClient.insert(chats).values({
      id: chatId,
      userId: userId,
    });
  });

  it('should be defined', () => {
    expect(upsertNoteTool).toBeDefined();
  });

  it('should create a new note when no ID is provided', async () => {
    const noteContent = 'This is a new note.';
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        content: noteContent,
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.note.status).toBe('created');
    expect(result.message).toBe('Note created successfully.');
    const newNoteId = result.note.id;

    const savedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, newNoteId),
    });

    expect(savedNote).toBeDefined();
    expect(savedNote?.content).toBe(noteContent);
    expect(savedNote?.chatId).toBe(chatId);
  });

  it('should create a new note with a provided ID if it does not exist', async () => {
    const noteId = randomUUID();
    const noteContent = 'This is a new note with a specific ID.';
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        id: noteId,
        content: noteContent,
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.note.id).toBe(noteId);
    expect(result.note.status).toBe('created');
    expect(result.message).toBe('Note created successfully.');

    const savedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });

    expect(savedNote).toBeDefined();
    expect(savedNote?.content).toBe(noteContent);
    expect(savedNote?.chatId).toBe(chatId);
  });

  it('should update an existing note', async () => {
    const noteId = randomUUID();
    const initialContent = 'Initial note content.';
    await dbClient.insert(chatNotes).values({
      id: noteId,
      chatId: chatId,
      content: initialContent,
    });

    const updatedContent = 'Updated note content.';
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        id: noteId,
        content: updatedContent,
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.note.id).toBe(noteId);
    expect(result.note.status).toBe('updated');
    expect(result.message).toBe('Note updated successfully.');

    const savedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });

    expect(savedNote).toBeDefined();
    expect(savedNote?.content).toBe(updatedContent);
  });

  it('should return an error for invalid input (e.g. missing content)', async () => {
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        id: randomUUID(), // Missing content
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to process note');
  });

  it('should return an error for malformed arguments', async () => {
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: 'invalid json',
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to process note');
  });

  it('should validate the tool call correctly', () => {
    expect(
      upsertNoteTool.canExecute({
        name: UPSERT_NOTE_TOOL_NAME,
        arguments: '{}',
      }),
    ).toBe(true);

    expect(
      upsertNoteTool.canExecute({
        name: 'other_tool',
        arguments: '{}',
      }),
    ).toBe(false);
  });
});
