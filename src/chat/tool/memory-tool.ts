import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, asc, cosineDistance, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { ChatCompletionTool } from 'openai/resources/chat';
import { AppConfigType } from 'src/config';
import { chatMessages } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { OpenAiProvider } from 'src/openai/openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Tool, ToolCall } from './tool';

const SEARCH_MEMORY_TOOL_NAME = 'search_memory';
const SIMILARITY_THRESHOLD = 0.7;
const MAX_RESULTS = 3;
const MESSAGES_BEFORE_COUNT = 5;
const MESSAGES_AFTER_COUNT = 5;

const searchMemorySchema = z.object({
  searchString: z.string().describe('The string to search for in the memory'),
});

interface SearchResult {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
  similarity?: number;
}

@Injectable()
export class MemoryTool implements Tool {
  constructor(
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly openai: OpenAiProvider,
    private readonly configService: ConfigService<AppConfigType>,
  ) {}

  private readonly logger = new Logger(MemoryTool.name);

  async execute(userId: string, input: ToolCall): Promise<string> {
    const args = searchMemorySchema.parse(JSON.parse(input.arguments));

    const embedding = await this._generateEmbedding(args.searchString);
    const results = await this._performSimilaritySearch(userId, embedding);

    if (results.length === 0) {
      return `No relevant memories found for: "${args.searchString}"`;
    }

    const combinedContext = await this._fetchCombinedContext(userId, results);
    const overallSummary = await this._generateOverallSummary(
      combinedContext,
      args.searchString,
    );

    return this._formatResultsWithSingleSummary(
      args.searchString,
      results,
      overallSummary,
    );
  }

  private async _generateEmbedding(searchString: string): Promise<number[]> {
    return this.openai.generateEmbedding(searchString);
  }

  private async _performSimilaritySearch(
    userId: string,
    embedding: number[],
  ): Promise<SearchResult[]> {
    const similarity = sql<number>`1 - (${cosineDistance(chatMessages.embedding, embedding)})`;

    return this.txHost.tx
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        role: chatMessages.role,
        createdAt: chatMessages.createdAt,
        similarity,
      })
      .from(chatMessages)
      .where(
        sql`${chatMessages.userId} = ${userId} AND ${similarity} > ${SIMILARITY_THRESHOLD}`,
      )
      .orderBy(desc(similarity))
      .limit(MAX_RESULTS);
  }

  private async _fetchCombinedContext(
    userId: string,
    results: SearchResult[],
  ): Promise<SearchResult[]> {
    const allContextMessagesNested = await Promise.all(
      results.map((result) =>
        this._fetchContextForMessage(
          userId,
          result,
          MESSAGES_BEFORE_COUNT,
          MESSAGES_AFTER_COUNT,
        ),
      ),
    );

    // Flatten, deduplicate by ID, and sort chronologically using standard JS
    const flattenedMessages = allContextMessagesNested.flat();

    const uniqueMessagesMap = new Map<string, SearchResult>();
    for (const message of flattenedMessages) {
      if (!uniqueMessagesMap.has(message.id)) {
        uniqueMessagesMap.set(message.id, message);
      }
    }
    const uniqueMessages = Array.from(uniqueMessagesMap.values());

    const combinedContext = uniqueMessages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return combinedContext;
  }

  private async _fetchContextForMessage(
    userId: string,
    message: SearchResult,
    beforeCount: number,
    afterCount: number,
  ): Promise<SearchResult[]> {
    const fetchMessages = async (
      order: 'asc' | 'desc',
      limit: number,
      operator: typeof lt,
    ): Promise<SearchResult[]> => {
      return this.txHost.tx
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          role: chatMessages.role,
          createdAt: chatMessages.createdAt,
          // We don't select similarity here as it's only relevant for the main result
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.userId, userId),
            operator(chatMessages.createdAt, message.createdAt),
          ),
        )
        .orderBy(
          order === 'asc'
            ? asc(chatMessages.createdAt)
            : desc(chatMessages.createdAt),
        )
        .limit(limit);
    };

    const [previousMessages, nextMessages] = await Promise.all([
      fetchMessages('desc', beforeCount, lt),
      fetchMessages('asc', afterCount, gt),
    ]);

    // Explicitly create the SearchResult object for the main message
    const mainMessage: SearchResult = {
      id: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt,
      similarity: message.similarity, // Keep similarity for the main message
    };

    return [...previousMessages.reverse(), mainMessage, ...nextMessages];
  }

  private async _generateOverallSummary(
    context: SearchResult[],
    searchString: string,
  ): Promise<string> {
    // Context is already sorted from _fetchCombinedContext
    const summaryPrompt = `
The following are relevant conversation snippets found in the memory based on the search query "${searchString}". Please provide a concise summary of these snippets, highlighting the key topics discussed.

Snippets:
${context.map((msg) => `${msg.role} [${msg.createdAt.toISOString()}]:\n ${msg.content} `).join('\n---MESSAGE SEPARATOR---\n')}

Summary:
    `.trim();

    try {
      const miniClient = this.openai.getMiniOpenAiClient();
      const summaryResponse = await miniClient.chat.completions.create({
        model: this.configService.getOrThrow('AZURE_OPENAI_MODEL_MINI'),
        messages: [{ role: 'system', content: summaryPrompt }],
        max_tokens: 1000,
      });

      return (
        summaryResponse.choices[0]?.message.content ||
        'Could not generate summary.'
      );
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      return 'Could not generate summary due to an error.';
    }
  }

  private _formatResultsWithSingleSummary(
    searchString: string,
    results: SearchResult[],
    overallSummary: string,
  ): string {
    return `What you remember given the search query "${searchString}":
---
${overallSummary}`;
  }

  toolDefinition: ChatCompletionTool = {
    type: 'function' as const,
    function: {
      name: SEARCH_MEMORY_TOOL_NAME,
      description:
        'Perform a semantic search on your memory to retrieve things you might have discussed in the past',
      parameters: zodToJsonSchema(searchMemorySchema),
    },
  } as const;

  canExecute(toolCall: ToolCall) {
    return toolCall.name === SEARCH_MEMORY_TOOL_NAME;
  }
}
