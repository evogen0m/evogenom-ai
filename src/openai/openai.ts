import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';
import { AppConfigType } from 'src/config';

@Injectable()
export class OpenAiProvider {
  constructor(private readonly configService: ConfigService<AppConfigType>) {}

  getOpenAiClient() {
    return new AzureOpenAI({
      apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
      endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
      apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
      deployment: this.configService.getOrThrow('AZURE_OPENAI_DEPLOYMENT'),
    });
  }

  getMiniOpenAiClient() {
    return new AzureOpenAI({
      apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
      endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
      apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
      deployment: this.configService.getOrThrow('AZURE_OPENAI_DEPLOYMENT_MINI'),
    });
  }

  getEmbeddingClient() {
    return new AzureOpenAI({
      apiKey: this.configService.getOrThrow('AZURE_OPENAI_API_KEY'),
      endpoint: this.configService.getOrThrow('AZURE_OPENAI_ENDPOINT'),
      apiVersion: this.configService.getOrThrow('AZURE_OPENAI_API_VERSION'),
      deployment: this.configService.getOrThrow('AZURE_OPENAI_EMBEDDING_MODEL'),
    });
  }

  async generateEmbedding(input: string): Promise<number[]> {
    const client = this.getEmbeddingClient();
    const sanitizedInput = input.replaceAll('\n', ' ');

    const response = await client.embeddings.create({
      input: sanitizedInput,
      model: this.configService.getOrThrow('AZURE_OPENAI_EMBEDDING_MODEL'),
    });

    return response.data[0].embedding;
  }
}
