import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
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
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

vi.mock('langfuse', () => ({
  observeOpenAI: vi.fn((client) => client),
}));

vi.mock('@sentry/nestjs', () => ({
  captureException: vi.fn(),
}));

describe('OpenAiProvider', () => {
  let openAiProvider: OpenAiProvider;
  let configService: ConfigService;
  let mockOpenAiClient: any;

  beforeEach(async () => {
    const moduleRef = await createTestingModuleWithDb({
      providers: [OpenAiProvider],
    }).compile();

    openAiProvider = moduleRef.get<OpenAiProvider>(OpenAiProvider);
    configService = moduleRef.get<ConfigService>(ConfigService);

    // Setup mock OpenAI client
    mockOpenAiClient = {
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };

    vi.mocked(AzureOpenAI).mockImplementation(() => mockOpenAiClient);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('when creating chat completions', () => {
    const mockConfig = {
      AZURE_OPENAI_API_KEY: 'test-api-key',
      AZURE_OPENAI_ENDPOINT: 'test-endpoint',
      AZURE_OPENAI_API_VERSION: 'test-api-version',
      AZURE_OPENAI_DEPLOYMENT: 'test-deployment',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'test-mini-deployment',
      AZURE_OPENAI_MODEL: 'gpt-4',
      AZURE_OPENAI_MODEL_MINI: 'gpt-3.5-turbo',
    };

    beforeEach(() => {
      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key as keyof typeof mockConfig],
      );
    });

    it('should create a non-streaming chat completion with standard model', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { content: 'Hello!' } }],
      };
      mockOpenAiClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
        stream: false,
      });

      expect(result).toEqual(mockResponse);
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.7,
        stream: false,
      });
    });

    it('should create a non-streaming chat completion with mini model', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { content: 'Hello!' } }],
      };
      mockOpenAiClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
        model: 'mini',
        stream: false,
      });

      expect(result).toEqual(mockResponse);
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.7,
        stream: false,
      });
    });

    it('should create a streaming chat completion', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' world!' } }] };
        },
      };
      mockOpenAiClient.chat.completions.create.mockResolvedValue(mockStream);

      const result = await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
        stream: true,
      });

      expect(result).toEqual(mockStream);
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.7,
        stream: true,
      });
    });

    it('should pass all optional parameters correctly', async () => {
      const mockResponse = { choices: [{ message: { content: 'Response' } }] };
      mockOpenAiClient.chat.completions.create.mockResolvedValue(mockResponse);

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'test',
            description: 'test function',
            parameters: {},
          },
        },
      ];
      const responseFormat = { type: 'json_object' as const };

      await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
        temperature: 0.5,
        topP: 0.9,
        maxTokens: 100,
        tools,
        toolChoice: 'required',
        responseFormat,
      });

      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 100,
        tools,
        tool_choice: 'required',
        response_format: responseFormat,
        stream: false,
      });
    });

    it('should set tool_choice to auto when tools are provided but toolChoice is not', async () => {
      const mockResponse = { choices: [{ message: { content: 'Response' } }] };
      mockOpenAiClient.chat.completions.create.mockResolvedValue(mockResponse);

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'test',
            description: 'test function',
            parameters: {},
          },
        },
      ];

      await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
        tools,
      });

      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tools,
          tool_choice: 'auto',
        }),
      );
    });

    it('should handle errors and capture them in Sentry', async () => {
      const error = new Error('OpenAI API error');
      mockOpenAiClient.chat.completions.create.mockRejectedValue(error);

      await expect(
        openAiProvider.createChatCompletion({
          messages: [{ role: 'user', content: 'Hi' }],
          sessionId: 'test-session',
        }),
      ).rejects.toThrow('OpenAI API error');

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          service: 'openai',
          operation: 'chat_completion',
          model: 'standard',
          stream: false,
        },
        extra: {
          sessionId: 'test-session',
          messageCount: 1,
          hasTools: false,
          temperature: 0.7,
          topP: undefined,
          maxTokens: undefined,
        },
      });
    });

    it('should handle streaming errors correctly', async () => {
      const error = new Error('Streaming error');
      mockOpenAiClient.chat.completions.create.mockRejectedValue(error);

      await expect(
        openAiProvider.createChatCompletion({
          messages: [{ role: 'user', content: 'Hi' }],
          sessionId: 'test-session',
          stream: true,
        }),
      ).rejects.toThrow('Streaming error');

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          service: 'openai',
          operation: 'chat_completion',
          model: 'standard',
          stream: true,
        },
        extra: {
          sessionId: 'test-session',
          messageCount: 1,
          hasTools: false,
          temperature: 0.7,
          topP: undefined,
          maxTokens: undefined,
        },
      });
    });
  });

  describe('when generating embeddings', () => {
    const mockConfig = {
      AZURE_OPENAI_API_KEY: 'test-api-key',
      AZURE_OPENAI_ENDPOINT: 'test-endpoint',
      AZURE_OPENAI_API_VERSION: 'test-api-version',
      AZURE_OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
    };

    beforeEach(() => {
      vi.spyOn(configService, 'getOrThrow').mockImplementation(
        (key) => mockConfig[key as keyof typeof mockConfig],
      );
    });

    it('should generate embeddings correctly', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockOpenAiClient.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await openAiProvider.generateEmbedding(
        'test input',
        'test-session-id',
      );

      expect(result).toEqual(mockEmbedding);
      expect(mockOpenAiClient.embeddings.create).toHaveBeenCalledWith({
        input: 'test input',
        model: 'text-embedding-3-small',
      });
    });

    it('should handle errors during embedding generation', async () => {
      const error = new Error('Embedding API error');
      mockOpenAiClient.embeddings.create.mockRejectedValue(error);

      await expect(
        openAiProvider.generateEmbedding('test input', 'test-session-id'),
      ).rejects.toThrow('Embedding API error');

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          service: 'openai',
          operation: 'embedding',
        },
        extra: {
          sessionId: 'test-session-id',
          inputLength: 10,
        },
      });
    });

    it('should handle empty input correctly', async () => {
      const mockEmbedding = [0.0, 0.0, 0.0];
      mockOpenAiClient.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await openAiProvider.generateEmbedding(
        '',
        'test-session-id',
      );

      expect(result).toEqual(mockEmbedding);
      expect(mockOpenAiClient.embeddings.create).toHaveBeenCalledWith({
        input: '',
        model: 'text-embedding-3-small',
      });
    });

    it('should handle very long input correctly', async () => {
      const longInput = 'a'.repeat(10000);
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockOpenAiClient.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await openAiProvider.generateEmbedding(
        longInput,
        'test-session-id',
      );

      expect(result).toEqual(mockEmbedding);
      expect(mockOpenAiClient.embeddings.create).toHaveBeenCalledWith({
        input: longInput,
        model: 'text-embedding-3-small',
      });
    });
  });

  describe('when using observeOpenAI wrapper', () => {
    it('should wrap all clients with observeOpenAI', async () => {
      const { observeOpenAI } = await import('langfuse');

      // Create a chat completion to trigger client creation
      await openAiProvider.createChatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
        sessionId: 'test-session',
      });

      // Generate embedding to trigger embedding client creation
      await openAiProvider.generateEmbedding('test', 'test-session');

      // Check that observeOpenAI was called with correct session IDs
      expect(observeOpenAI).toHaveBeenCalledWith(expect.any(Object), {
        sessionId: 'test-session',
      });
    });
  });
});
