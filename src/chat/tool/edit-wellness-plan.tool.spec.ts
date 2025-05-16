import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { chats, users } from 'src/db';
import { DRIZZLE_INSTANCE, DrizzleInstanceType } from 'src/db/drizzle.provider';
import { OpenAiProvider } from 'src/openai/openai';
import { createTestingModuleWithDb } from 'test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EDIT_WELLNESS_PLAN_TOOL_NAME,
  EditWellnessPlanTool,
} from './edit-wellness-plan.tool';
import { ToolCall } from './tool';

describe('EditWellnessPlanTool', () => {
  let editWellnessPlanTool: EditWellnessPlanTool;
  let openAiProvider: OpenAiProvider;
  let dbClient: DrizzleInstanceType;
  let userId: string;
  let chatId: string;

  const mockMiniOpenAiClient = {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up OpenAI mock
    openAiProvider = {
      getMiniOpenAiClient: vi.fn().mockReturnValue(mockMiniOpenAiClient),
    } as unknown as OpenAiProvider;

    const mockConfigService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === 'AZURE_OPENAI_MODEL_MINI') return 'mock-mini-model';
        return 'mock-value';
      }),
    };

    const moduleBuilder = createTestingModuleWithDb({
      providers: [
        EditWellnessPlanTool,
        {
          provide: OpenAiProvider,
          useValue: openAiProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    const module = await moduleBuilder.compile();

    editWellnessPlanTool =
      module.get<EditWellnessPlanTool>(EditWellnessPlanTool);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Clear test database tables before each test
    await dbClient.execute(sql`TRUNCATE TABLE chat CASCADE`);
    await dbClient.execute(sql`TRUNCATE TABLE users CASCADE`);

    // Generate a test user ID and create user
    userId = randomUUID();
    await dbClient.insert(users).values({ id: userId });

    // Create a chat for the user
    chatId = randomUUID();
    await dbClient
      .insert(chats)
      .values({ id: chatId, userId, wellnessPlan: 'Initial wellness plan.' });
  });

  describe('when executing the tool', () => {
    it('should successfully update the wellness plan', async () => {
      const newPlanContent = 'This is the updated wellness plan.';
      mockMiniOpenAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: newPlanContent } }],
      });

      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: JSON.stringify({
          editingInstructions: 'Update the plan.',
        }),
      };

      const result = await editWellnessPlanTool.execute(userId, toolCall);

      expect(result).toBe('Wellness plan updated successfully.');
      expect(mockMiniOpenAiClient.chat.completions.create).toHaveBeenCalled();
      const updatedChat = await dbClient.query.chats.findFirst({
        where: eq(chats.id, chatId),
      });
      expect(updatedChat?.wellnessPlan).toBe(newPlanContent);
    });

    it('should return a message if no wellness plan exists and instructions are to create one', async () => {
      // Delete existing chat to simulate no wellness plan
      await dbClient.delete(chats).where(eq(chats.id, chatId));
      // Re-create chat without a wellness plan
      await dbClient
        .insert(chats)
        .values({ id: chatId, userId, wellnessPlan: '' });

      const newPlanContent = 'This is a new wellness plan.';
      mockMiniOpenAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: newPlanContent } }],
      });

      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: JSON.stringify({
          editingInstructions: 'Create a new plan.',
        }),
      };

      const result = await editWellnessPlanTool.execute(userId, toolCall);
      expect(result).toBe('Wellness plan updated successfully.');
      const updatedChat = await dbClient.query.chats.findFirst({
        where: eq(chats.id, chatId),
      });
      expect(updatedChat?.wellnessPlan).toBe(newPlanContent);
    });

    it('should handle parsing errors for tool input', async () => {
      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: 'invalid json',
      };

      const result = await editWellnessPlanTool.execute(userId, toolCall);
      expect(result).toContain('Failed to parse tool input');
    });

    it('should handle cases where no chat is found for the user', async () => {
      // Delete the user to simulate no chat found
      await dbClient.delete(users).where(eq(users.id, userId));

      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: JSON.stringify({
          editingInstructions: 'Update the plan.',
        }),
      };

      const result = await editWellnessPlanTool.execute(userId, toolCall);
      expect(result).toBe(
        'No chat found for the user. Cannot edit wellness plan.',
      );
    });

    it('should handle errors during OpenAI API calls', async () => {
      mockMiniOpenAiClient.chat.completions.create.mockRejectedValueOnce(
        new Error('OpenAI API error'),
      );

      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: JSON.stringify({
          editingInstructions: 'Update the plan.',
        }),
      };

      const result = await editWellnessPlanTool.execute(userId, toolCall);
      expect(result).toBe(
        'An error occurred while updating the wellness plan.',
      );
    });

    it('should handle when OpenAI returns no content', async () => {
      mockMiniOpenAiClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: JSON.stringify({
          editingInstructions: 'Update the plan.',
        }),
      };
      const result = await editWellnessPlanTool.execute(userId, toolCall);
      expect(result).toBe('Failed to generate an updated wellness plan.');
    });
  });

  describe('when checking if the tool can execute', () => {
    it('should return true for edit_wellness_plan tool calls', () => {
      const toolCall: ToolCall = {
        name: EDIT_WELLNESS_PLAN_TOOL_NAME,
        arguments: '{}',
      };
      expect(editWellnessPlanTool.canExecute(toolCall)).toBe(true);
    });

    it('should return false for other tool calls', () => {
      const toolCall: ToolCall = {
        name: 'some_other_tool',
        arguments: '{}',
      };
      expect(editWellnessPlanTool.canExecute(toolCall)).toBe(false);
    });
  });
});
