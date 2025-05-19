import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { desc, eq } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { ChatCompletionMessageParam } from 'openai/resources/index.js';
import { AppConfigType } from 'src/config';
import { DbTransactionAdapter, chats } from 'src/db';
import { OpenAiProvider } from 'src/openai/openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

// Tool Name
export const EDIT_WELLNESS_PLAN_TOOL_NAME = 'edit_wellness_plan';

// Input Schema for the tool using Zod
const editWellnessPlanToolInputSchema = z.object({
  editingInstructions: z
    .string()
    .describe('Detailed instructions on how to modify the wellness plan.'),
});

// Infer the type from the Zod schema
type EditWellnessPlanToolInput = z.infer<
  typeof editWellnessPlanToolInputSchema
>;

@Injectable()
export class EditWellnessPlanTool implements Tool {
  private readonly logger = new Logger(EditWellnessPlanTool.name);

  constructor(
    private readonly openaiProvider: OpenAiProvider,
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly configService: ConfigService<AppConfigType>,
  ) {}

  readonly toolDefinition: ChatCompletionTool = {
    type: 'function',
    function: {
      name: EDIT_WELLNESS_PLAN_TOOL_NAME,
      description:
        "Edits the user's wellness plan based on the provided instructions. ",
      parameters: zodToJsonSchema(editWellnessPlanToolInputSchema),
    },
  };

  canExecute(toolCall: ToolCall): boolean {
    return toolCall.name === EDIT_WELLNESS_PLAN_TOOL_NAME;
  }

  async execute(userId: string, toolCall: ToolCall): Promise<string> {
    let input: EditWellnessPlanToolInput;
    try {
      input = editWellnessPlanToolInputSchema.parse(
        JSON.parse(toolCall.arguments),
      );
    } catch (error) {
      this.logger.error(
        `Failed to parse tool input for ${EDIT_WELLNESS_PLAN_TOOL_NAME}: ${error.message}`,
        error.stack,
      );
      return `Failed to parse tool input: ${error.message}. Please ensure arguments are valid JSON and match the schema.`;
    }

    // Fetch the latest chat for the user to get the current wellness plan
    const latestChat = await this.txHost.tx.query.chats.findFirst({
      where: eq(chats.userId, userId),
      orderBy: [desc(chats.createdAt)],
      columns: { id: true, wellnessPlan: true },
    });

    if (!latestChat) {
      return 'No chat found for the user. Cannot edit wellness plan.';
    }

    const currentWellnessPlan = latestChat.wellnessPlan || '';

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an AI assistant helping to edit a wellness plan. The user wants to make specific changes. Output only the updated wellness plan in Markdown format. 
          Ensure the entire plan is returned, not just the changed parts. If no plan exists and instructions are to create one, generate it. If a plan exists, modify it according to the instructions. You will keep the plan structured and readable. Do not add any content outside of the instructions provided.
          Use three levels of headings (if needed):
          `,
      },
      {
        role: 'user',
        content: `
<Current Wellness Plan>
${currentWellnessPlan || 'No wellness plan exists yet.'}
</Current Wellness Plan>

<Editing Instructions>
${input.editingInstructions}
</Editing Instructions>

Please provide the new, complete wellness plan based on these instructions.
        `,
      },
    ];

    try {
      const miniClient = this.openaiProvider.getMiniOpenAiClient({
        sessionId: userId, // Or a more specific session ID if available
      });
      const response = await miniClient.chat.completions.create({
        model: this.configService.getOrThrow('AZURE_OPENAI_MODEL_MINI'),
        messages,
        temperature: 0.2,
      });

      const newWellnessPlan = response.choices[0]?.message?.content?.trim();

      if (!newWellnessPlan) {
        this.logger.warn('OpenAI failed to generate an updated wellness plan.');
        return 'Failed to generate an updated wellness plan.';
      }

      this.logger.debug('New wellness plan:', newWellnessPlan);

      // Save the new wellness plan to the database
      await this.txHost.tx
        .update(chats)
        .set({ wellnessPlan: newWellnessPlan, updatedAt: new Date() })
        .where(eq(chats.id, latestChat.id));

      return 'Wellness plan updated successfully.';
    } catch (error) {
      this.logger.error('Error updating wellness plan via OpenAI:', error);
      return 'An error occurred while updating the wellness plan.';
    }
  }
}
