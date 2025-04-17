import { ConfigService } from '@nestjs/config';
import { AzureOpenAI } from 'openai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingModuleWithDb } from '../../test/utils';
import { OpenAiProvider } from './openai';

vi.mock('openai', () => {
  return {
    AzureOpenAI: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
    })),
  };
});

describe('OpenAiProvider', () => {
  let openAiProvider: OpenAiProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await createTestingModuleWithDb({
      providers: [OpenAiProvider],
    }).compile();

    openAiProvider = moduleRef.get<OpenAiProvider>(OpenAiProvider);
    configService = moduleRef.get<ConfigService>(ConfigService);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('when creating OpenAI clients', () => {
    it('should create a main OpenAI client with correct configuration', () => {
      const mockConfig = {
        AZURE_OPENAI_API_KEY: 'test-api-key',
        AZURE_OPENAI_ENDPOINT: 'test-endpoint',
        AZURE_OPENAI_API_VERSION: 'test-api-version',
        AZURE_OPENAI_DEPLOYMENT: 'test-deployment',
      };

      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key],
      );

      openAiProvider.getOpenAiClient();

      expect(AzureOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        endpoint: 'test-endpoint',
        apiVersion: 'test-api-version',
        deployment: 'test-deployment',
      });
    });

    it('should create a mini OpenAI client with correct configuration', () => {
      const mockConfig = {
        AZURE_OPENAI_API_KEY: 'test-api-key',
        AZURE_OPENAI_ENDPOINT: 'test-endpoint',
        AZURE_OPENAI_API_VERSION: 'test-api-version',
        AZURE_OPENAI_DEPLOYMENT_MINI: 'test-mini-deployment',
      };

      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key],
      );

      openAiProvider.getMiniOpenAiClient();

      expect(AzureOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        endpoint: 'test-endpoint',
        apiVersion: 'test-api-version',
        deployment: 'test-mini-deployment',
      });
    });

    it('should create an embedding client with correct configuration', () => {
      const mockConfig = {
        AZURE_OPENAI_API_KEY: 'test-api-key',
        AZURE_OPENAI_ENDPOINT: 'test-endpoint',
        AZURE_OPENAI_API_VERSION: 'test-api-version',
        AZURE_OPENAI_EMBEDDING_MODEL: 'test-embedding-model',
      };

      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key],
      );

      openAiProvider.getEmbeddingClient();

      expect(AzureOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        endpoint: 'test-endpoint',
        apiVersion: 'test-api-version',
        deployment: 'test-embedding-model',
      });
    });
  });

  describe('when generating embeddings', () => {
    it('should generate embeddings correctly', async () => {
      const mockConfig = {
        AZURE_OPENAI_API_KEY: 'test-api-key',
        AZURE_OPENAI_ENDPOINT: 'test-endpoint',
        AZURE_OPENAI_API_VERSION: 'test-api-version',
        AZURE_OPENAI_EMBEDDING_MODEL: 'test-embedding-model',
      };

      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key],
      );

      const mockEmbeddingsClient = {
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
          }),
        },
      };

      vi.spyOn(openAiProvider, 'getEmbeddingClient').mockReturnValue(
        mockEmbeddingsClient as any,
      );

      const embedding = await openAiProvider.generateEmbedding('test input');

      expect(mockEmbeddingsClient.embeddings.create).toHaveBeenCalledWith({
        input: 'test input',
        model: 'test-embedding-model',
      });

      expect(embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('should pass through the embedding model from config', async () => {
      const mockConfig = {
        AZURE_OPENAI_EMBEDDING_MODEL: 'test-embedding-model',
      };

      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key],
      );

      const mockEmbeddingsClient = {
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [{ embedding: [0.4, 0.5, 0.6] }],
          }),
        },
      };

      vi.spyOn(openAiProvider, 'getEmbeddingClient').mockReturnValue(
        mockEmbeddingsClient as any,
      );

      await openAiProvider.generateEmbedding('another test');

      expect(mockEmbeddingsClient.embeddings.create).toHaveBeenCalledWith({
        input: 'another test',
        model: 'test-embedding-model',
      });
    });
  });
});
