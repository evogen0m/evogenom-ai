import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { observeOpenAI } from 'langfuse';
import OpenAI, { AzureOpenAI } from 'openai';
import {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/chat';
import { Stream } from 'openai/streaming';
import { AppConfigType } from 'src/config';

@Injectable()
export class OpenAiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly configService: ConfigService<AppConfigType>) {}

  private getOpenAiClient({ sessionId }: { sessionId: string }) {
    return observeOpenAI(
      new AzureOpenAI({
        apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
        endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
        apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
        deployment: this.configService.getOrThrow('AZURE_OPENAI_DEPLOYMENT'),
      }),
      {
        sessionId,
      },
    );
  }

  private getMiniOpenAiClient({ sessionId }: { sessionId: string }) {
    return observeOpenAI(
      new AzureOpenAI({
        apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
        endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
        apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
        deployment: this.configService.getOrThrow(
          'AZURE_OPENAI_DEPLOYMENT_MINI',
        ),
      }),
      {
        sessionId,
      },
    );
  }

  private getEmbeddingClient({ sessionId }: { sessionId: string }) {
    return observeOpenAI(
      new AzureOpenAI({
        apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
        endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
        apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
        deployment: this.configService.getOrThrow(
          'AZURE_OPENAI_EMBEDDING_MODEL',
        ),
      }),
      {
        sessionId,
      },
    );
  }

  async createChatCompletion(params: {
    messages: ChatCompletionMessageParam[];
    sessionId: string;
    stream?: false;
    model?: 'mini' | 'standard';
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    tools?: ChatCompletionCreateParams['tools'];
    toolChoice?: ChatCompletionCreateParams['tool_choice'];
    responseFormat?: ChatCompletionCreateParams['response_format'];
  }): Promise<OpenAI.Chat.Completions.ChatCompletion>;

  async createChatCompletion(params: {
    messages: ChatCompletionMessageParam[];
    sessionId: string;
    stream: true;
    model?: 'mini' | 'standard';
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    tools?: ChatCompletionCreateParams['tools'];
    toolChoice?: ChatCompletionCreateParams['tool_choice'];
    responseFormat?: ChatCompletionCreateParams['response_format'];
  }): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;

  async createChatCompletion(params: {
    messages: ChatCompletionMessageParam[];
    sessionId: string;
    stream?: boolean;
    model?: 'mini' | 'standard';
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    tools?: ChatCompletionCreateParams['tools'];
    toolChoice?: ChatCompletionCreateParams['tool_choice'];
    responseFormat?: ChatCompletionCreateParams['response_format'];
  }): Promise<
    | OpenAI.Chat.Completions.ChatCompletion
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
  > {
    const {
      messages,
      sessionId,
      stream = false,
      model = 'standard',
      temperature = 0.7,
      topP,
      maxTokens,
      tools,
      toolChoice = tools ? 'auto' : undefined,
      responseFormat,
    } = params;

    try {
      const client =
        model === 'mini'
          ? this.getMiniOpenAiClient({ sessionId })
          : this.getOpenAiClient({ sessionId });

      const modelName =
        model === 'mini'
          ? this.configService.getOrThrow('AZURE_OPENAI_MODEL_MINI')
          : this.configService.getOrThrow('AZURE_OPENAI_MODEL');

      const completionParams: ChatCompletionCreateParams = {
        model: modelName,
        messages,
        temperature,
        ...(topP !== undefined && { top_p: topP }),
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
        ...(tools && { tools }),
        ...(toolChoice && { tool_choice: toolChoice }),
        ...(responseFormat && { response_format: responseFormat }),
      };

      if (stream) {
        const streamParams: ChatCompletionCreateParamsStreaming = {
          ...completionParams,
          stream: true,
        };
        return await client.chat.completions.create(streamParams);
      } else {
        return await client.chat.completions.create({
          ...completionParams,
          stream: false,
        });
      }
    } catch (error) {
      // Log error details
      this.logger.error(
        `Failed to create chat completion: ${error.message}`,
        error.stack,
      );

      // Capture error context in Sentry
      Sentry.captureException(error, {
        tags: {
          service: 'openai',
          operation: 'chat_completion',
          model: model,
          stream: stream,
        },
        extra: {
          sessionId,
          messageCount: messages.length,
          hasTools: !!tools,
          temperature,
          topP,
          maxTokens,
        },
      });

      throw error;
    }
  }

  async generateEmbedding(input: string, sessionId: string): Promise<number[]> {
    try {
      const client = this.getEmbeddingClient({ sessionId });

      const response = await client.embeddings.create({
        input: input,
        model: this.configService.getOrThrow('AZURE_OPENAI_EMBEDDING_MODEL'),
      });

      return response.data[0].embedding;
    } catch (error) {
      // Log error details
      this.logger.error(
        `Failed to generate embedding: ${error.message}`,
        error.stack,
      );

      // Capture error context in Sentry
      Sentry.captureException(error, {
        tags: {
          service: 'openai',
          operation: 'embedding',
        },
        extra: {
          sessionId,
          inputLength: input.length,
        },
      });

      throw error;
    }
  }
}
