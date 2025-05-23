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
        notes: [{ content: noteContent }],
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].status).toBe('created');
    const newNoteId = result.results[0].id;

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
        notes: [{ id: noteId, content: noteContent }],
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe(noteId);
    expect(result.results[0].status).toBe('created');

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
        notes: [{ id: noteId, content: updatedContent }],
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe(noteId);
    expect(result.results[0].status).toBe('updated');

    const savedNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, noteId),
    });

    expect(savedNote).toBeDefined();
    expect(savedNote?.content).toBe(updatedContent);
  });

  it('should handle multiple note operations in one call (create and update)', async () => {
    // Existing note to be updated
    const existingNoteId = randomUUID();
    const initialContent = 'Initial content for update.';
    await dbClient.insert(chatNotes).values({
      id: existingNoteId,
      chatId: chatId,
      content: initialContent,
    });

    // New note to be created
    const newNoteContent = 'Content for new note.';

    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        notes: [
          { id: existingNoteId, content: 'Updated content.' },
          { content: newNoteContent },
        ],
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);

    const updatedResult = result.results.find((r) => r.id === existingNoteId);
    const createdResult = result.results.find((r) => r.id !== existingNoteId);

    expect(updatedResult?.status).toBe('updated');
    expect(createdResult?.status).toBe('created');
    const newNoteId = createdResult?.id;

    const updatedDbNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, existingNoteId),
    });
    expect(updatedDbNote?.content).toBe('Updated content.');

    const createdDbNote = await dbClient.query.chatNotes.findFirst({
      where: (notes, { eq }) => eq(notes.id, newNoteId!),
    });
    expect(createdDbNote?.content).toBe(newNoteContent);
  });

  it('should return an error for invalid input (e.g. missing content)', async () => {
    const toolCall: ToolCall = {
      name: UPSERT_NOTE_TOOL_NAME,
      arguments: JSON.stringify({
        notes: [{ id: randomUUID() }], // Missing content
      }),
    };

    const resultString = await upsertNoteTool.execute(userId, toolCall, chatId);
    const result = JSON.parse(resultString);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to process notes');
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
