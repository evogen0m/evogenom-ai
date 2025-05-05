import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { chats, followUps, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelFollowupTool } from './cancel-followup.tool';
import { ToolCall } from './tool';

describe('CancelFollowupTool', () => {
  let cancelFollowupTool: CancelFollowupTool;
  let dbClient: DrizzleInstanceType;
  let userId: string;
  let otherUserId: string;
  let chatId: string;
  let followupId: string;
  let otherUserFollowupId: string;
  let cancelledFollowupId: string;

  beforeEach(async () => {
    const moduleBuilder = createTestingModuleWithDb({
      providers: [CancelFollowupTool],
    });

    const module = await moduleBuilder.compile();

    cancelFollowupTool = module.get<CancelFollowupTool>(CancelFollowupTool);
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

    // Create another user for permission testing
    otherUserId = randomUUID();
    await dbClient.insert(users).values({
      id: otherUserId,
      timeZone: 'Europe/Helsinki',
    });

    // Create a chat for the user
    chatId = randomUUID();
    await dbClient.insert(chats).values({
      id: chatId,
      userId,
    });

    // Create test followups
    followupId = randomUUID();
    await dbClient.insert(followUps).values({
      id: followupId,
      userId,
      chatId,
      content: 'Test followup 1',
      dueDate: new Date('2023-12-31T12:00:00Z'),
      status: 'pending',
    });

    // Create a followup for the other user
    otherUserFollowupId = randomUUID();
    await dbClient.insert(followUps).values({
      id: otherUserFollowupId,
      userId: otherUserId,
      chatId,
      content: 'Other user followup',
      dueDate: new Date('2023-12-31T12:00:00Z'),
      status: 'pending',
    });

    // Create a cancelled followup
    cancelledFollowupId = randomUUID();
    await dbClient.insert(followUps).values({
      id: cancelledFollowupId,
      userId,
      chatId,
      content: 'Already cancelled followup',
      dueDate: new Date('2023-12-31T12:00:00Z'),
      status: 'cancelled',
    });
  });

  it('should successfully cancel a pending followup', async () => {
    const toolCall: ToolCall = {
      name: 'cancel_followup',
      arguments: JSON.stringify({
        followupId,
      }),
    };

    const result = await cancelFollowupTool.execute(userId, toolCall);

    expect(result).toBe('Follow-up cancelled successfully.');

    // Verify the followup was cancelled in the database
    const updatedFollowup = await dbClient
      .select()
      .from(followUps)
      .where(sql`id = ${followupId}`)
      .limit(1);

    expect(updatedFollowup[0].status).toBe('cancelled');
  });

  it('should return error when followup ID does not exist', async () => {
    const nonExistentId = randomUUID();
    const toolCall: ToolCall = {
      name: 'cancel_followup',
      arguments: JSON.stringify({
        followupId: nonExistentId,
      }),
    };

    const result = await cancelFollowupTool.execute(userId, toolCall);

    expect(result).toBe(`Follow-up with ID ${nonExistentId} not found.`);
  });

  it("should not allow cancelling another user's followup", async () => {
    const toolCall: ToolCall = {
      name: 'cancel_followup',
      arguments: JSON.stringify({
        followupId: otherUserFollowupId,
      }),
    };

    const result = await cancelFollowupTool.execute(userId, toolCall);

    expect(result).toBe("You don't have permission to cancel this follow-up.");

    // Verify the followup was not cancelled
    const followup = await dbClient
      .select()
      .from(followUps)
      .where(sql`id = ${otherUserFollowupId}`)
      .limit(1);

    expect(followup[0].status).toBe('pending');
  });

  it('should indicate when a followup is already cancelled', async () => {
    const toolCall: ToolCall = {
      name: 'cancel_followup',
      arguments: JSON.stringify({
        followupId: cancelledFollowupId,
      }),
    };

    const result = await cancelFollowupTool.execute(userId, toolCall);

    expect(result).toBe('This follow-up has already been cancelled.');
  });

  it('should validate the tool call correctly', () => {
    expect(
      cancelFollowupTool.canExecute({
        name: 'cancel_followup',
        arguments: '{}',
      }),
    ).toBe(true);

    expect(
      cancelFollowupTool.canExecute({
        name: 'other_tool',
        arguments: '{}',
      }),
    ).toBe(false);
  });
});
