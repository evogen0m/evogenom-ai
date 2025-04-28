import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { observeOpenAI } from 'langfuse';
import { AzureOpenAI } from 'openai';
import { AppConfigType } from 'src/config';

@Injectable()
export class OpenAiProvider {
  constructor(private readonly configService: ConfigService<AppConfigType>) {}

  getOpenAiClient({ sessionId }: { sessionId: string }) {
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

  getMiniOpenAiClient({ sessionId }: { sessionId: string }) {
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

  getEmbeddingClient({ sessionId }: { sessionId: string }) {
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

  async generateEmbedding(input: string, sessionId: string): Promise<number[]> {
    const client = this.getEmbeddingClient({ sessionId });

    const response = await client.embeddings.create({
      input: input,
      model: this.configService.getOrThrow('AZURE_OPENAI_EMBEDDING_MODEL'),
    });

    return response.data[0].embedding;
  }
}
