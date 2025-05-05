import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chats, followUps, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { FollowupTool } from './followup.tool';
import { ToolCall } from './tool';

describe('FollowupTool', () => {
  let followupTool: FollowupTool;
  let dbClient: DrizzleInstanceType;
  let userId: string;
  let chatId: string;

  beforeEach(async () => {
    const moduleBuilder = createTestingModuleWithDb({
      providers: [FollowupTool],
    });

    const module = await moduleBuilder.compile();

    followupTool = module.get<FollowupTool>(FollowupTool);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE follow_up CASCADE`);
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

  it('should create a follow-up with valid data', async () => {
    // Create a tool call
    const toolCall: ToolCall = {
      name: 'create_followup',
      arguments: JSON.stringify({
        content: 'Remember to follow up about the project deadline',
        date: '2023-12-31',
        time: '12:00',
      }),
    };

    // Execute the tool
    const result = await followupTool.execute(userId, toolCall);

    // Check the result message
    expect(result).toContain('Follow-up scheduled successfully');
    expect(result).toContain('2023-12-31');
    expect(result).toContain('12:00');

    // Verify the follow-up was created in the database
    const savedFollowUps = await dbClient
      .select()
      .from(followUps)
      .where(sql`user_id = ${userId}`);

    expect(savedFollowUps).toHaveLength(1);
    expect(savedFollowUps[0].content).toBe(
      'Remember to follow up about the project deadline',
    );
    expect(savedFollowUps[0].userId).toBe(userId);
    expect(savedFollowUps[0].chatId).toBe(chatId);
    expect(savedFollowUps[0].status).toBe('pending');
  });

  it('should reject a follow-up with invalid date format', async () => {
    // Create a tool call with invalid date
    const toolCall: ToolCall = {
      name: 'create_followup',
      arguments: JSON.stringify({
        content: 'Remember to follow up about the project deadline',
        date: 'not-a-date',
        time: '12:00',
      }),
    };

    // Execute the tool
    const result = await followupTool.execute(userId, toolCall);

    // Check the result message indicates failure
    expect(result).toContain('Invalid date format');

    // Verify no follow-up was created
    const savedFollowUps = await dbClient
      .select()
      .from(followUps)
      .where(sql`user_id = ${userId}`);

    expect(savedFollowUps).toHaveLength(0);
  });

  it('should reject a follow-up with invalid time format', async () => {
    // Create a tool call with invalid time
    const toolCall: ToolCall = {
      name: 'create_followup',
      arguments: JSON.stringify({
        content: 'Remember to follow up about the project deadline',
        date: '2023-12-31',
        time: 'not-a-time',
      }),
    };

    // Execute the tool
    const result = await followupTool.execute(userId, toolCall);

    // Check the result message indicates failure
    expect(result).toContain('Invalid time format');

    // Verify no follow-up was created
    const savedFollowUps = await dbClient
      .select()
      .from(followUps)
      .where(sql`user_id = ${userId}`);

    expect(savedFollowUps).toHaveLength(0);
  });

  it('should validate the tool call correctly', () => {
    expect(
      followupTool.canExecute({
        name: 'create_followup',
        arguments: '{}',
      }),
    ).toBe(true);

    expect(
      followupTool.canExecute({
        name: 'other_tool',
        arguments: '{}',
      }),
    ).toBe(false);
  });
});
