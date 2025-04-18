/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentfulApiClient } from '../../contentful/contentful-api-client';
import {
  TypeProductFields,
  TypeResultRowFields,
} from '../../contentful/generated-types';
import { EvogenomApiClient } from '../../evogenom-api-client/evogenom-api.client';
import {
  ProductFragment,
  UserResultFragment,
} from '../../evogenom-api-client/generated/request';
import { PromptService } from './prompt.service';

describe('PromptService', () => {
  let service: PromptService;
  let evogenomApiClient: EvogenomApiClient;
  let contentfulApiClient: ContentfulApiClient;

  // Mock data
  const mockUserId = 'user-123';
  const mockEvogenomApiToken = 'token-123';

  const mockUserResults: UserResultFragment[] = [
    {
      id: 'result-1',
      name: 'Test Result 1',
      description: 'Test Description 1',
      createdAt: '2023-01-01',
      sampleResultsId: 'sample-1',
      productResultsId: 'product-1',
    },
    {
      id: 'result-2',
      name: 'Test Result 2',
      description: 'Test Description 2',
      createdAt: '2023-01-02',
      sampleResultsId: 'sample-2',
      productResultsId: 'product-2',
    },
  ];

  const mockProducts: ProductFragment[] = [
    {
      id: 'product-1',
      name: 'Product One',
      productCode: '101',
    },
    {
      id: 'product-2',
      name: 'Product Two',
      productCode: '102',
    },
  ];

  const mockResultRows = {
    items: [
      {
        fields: {
          productCode: '101',
          resultText: 'Result for Product One',
        },
      },
      {
        fields: {
          productCode: '102',
          resultText: 'Result for Product Two',
        },
      },
    ],
  };

  const mockProducts2 = {
    items: [
      {
        fields: {
          productCode: 101,
          name: 'Product One',
          description: 'Description for Product One',
        },
      },
      {
        fields: {
          productCode: 102,
          name: 'Product Two',
          description: 'Description for Product Two',
        },
      },
    ],
  };

  beforeEach(async () => {
    // Create mocks
    evogenomApiClient = {
      getUserResults: vi.fn().mockResolvedValue(mockUserResults),
      getAllProducts: vi.fn().mockResolvedValue(mockProducts),
    } as unknown as EvogenomApiClient;

    contentfulApiClient = {
      getResults: vi.fn().mockResolvedValue(mockResultRows),
      getProducts: vi.fn().mockResolvedValue(mockProducts2),
    } as unknown as ContentfulApiClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: EvogenomApiClient,
          useValue: evogenomApiClient,
        },
        {
          provide: ContentfulApiClient,
          useValue: contentfulApiClient,
        },
      ],
    }).compile();

    service = module.get<PromptService>(PromptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemPrompt', () => {
    it('should fetch user results and products from Evogenom API', async () => {
      await service.getSystemPrompt(mockUserId, mockEvogenomApiToken);

      expect(evogenomApiClient.getUserResults).toHaveBeenCalledWith(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(evogenomApiClient.getAllProducts).toHaveBeenCalledWith(
        mockEvogenomApiToken,
      );
    });

    it('should fetch result rows and products from Contentful', async () => {
      await service.getSystemPrompt(mockUserId, mockEvogenomApiToken);

      expect(contentfulApiClient.getResults).toHaveBeenCalledWith([
        '101',
        '102',
      ]);
      expect(contentfulApiClient.getProducts).toHaveBeenCalledWith([
        '101',
        '102',
      ]);
    });

    it('should return formatted system prompt', async () => {
      const spy = vi.spyOn(service, 'formatSystemPrompt');

      await service.getSystemPrompt(mockUserId, mockEvogenomApiToken);

      expect(spy).toHaveBeenCalled();
    });

    it('should include chat context metadata when provided', async () => {
      const metadata = {
        currentMessageCount: 5,
        totalHistoryCount: 10,
      };

      const spy = vi.spyOn(service, 'formatSystemPrompt');

      await service.getSystemPrompt(mockUserId, mockEvogenomApiToken, metadata);

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        metadata,
      );
    });
  });

  describe('getResultRowsByProductCode', () => {
    it('should fetch and format result rows by product code', async () => {
      const productCodes = ['101', '102'];
      const result = await service.getResultRowsByProductCode(productCodes);

      expect(contentfulApiClient.getResults).toHaveBeenCalledWith(productCodes);
      expect(result).toHaveProperty('101');
      expect(result).toHaveProperty('102');
    });
  });

  describe('getProductByProductCode', () => {
    it('should fetch and format products by product code', async () => {
      const productCodes = ['101', '102'];
      const result = await service.getProductByProductCode(productCodes);

      expect(contentfulApiClient.getProducts).toHaveBeenCalledWith(
        productCodes,
      );
      expect(result).toHaveProperty('101');
      expect(result).toHaveProperty('102');
    });
  });

  describe('formatSystemPrompt', () => {
    it('should format the system prompt with product results', () => {
      const results: Record<string, TypeResultRowFields> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
        } as any,
      };

      const products: Record<string, TypeProductFields> = {
        '101': {
          productCode: 101,
          name: 'Product One',
        } as any,
      };

      const prompt = service.formatSystemPrompt(results, products);

      expect(prompt).toContain('Product One: Result for Product One');
      expect(prompt).toContain('# Your Role & Purpose');
    });

    it('should include chat context metadata when provided', () => {
      const results: Record<string, TypeResultRowFields> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
        } as any,
      };

      const products: Record<string, TypeProductFields> = {
        '101': {
          productCode: 101,
          name: 'Product One',
        } as any,
      };

      const metadata = {
        currentMessageCount: 5,
        totalHistoryCount: 10,
      };

      const prompt = service.formatSystemPrompt(results, products, metadata);

      expect(prompt).toContain('Current conversation: 5 messages');
      expect(prompt).toContain('Total history: 10 messages');
      expect(prompt).toContain(
        'Note: There are previous conversations not included in this context',
      );
    });

    it('should handle content wrapped in ContentfulWrapper', () => {
      const results: Record<string, TypeResultRowFields> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
        } as any,
      };

      const products: Record<string, TypeProductFields> = {
        '101': {
          productCode: 101,
          name: { values: 'Product One Wrapped' },
        } as any,
      };

      const prompt = service.formatSystemPrompt(results, products);

      expect(prompt).toContain('Product One Wrapped');
    });

    it('should skip products or results that are not found', () => {
      const results: Record<string, TypeResultRowFields> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
        } as any,
      };

      const products: Record<string, TypeProductFields> = {
        '102': {
          productCode: 102,
          name: 'Product Two',
        } as any,
      };

      const prompt = service.formatSystemPrompt(results, products);

      expect(prompt).not.toContain('Product One');
      expect(prompt).not.toContain('Product Two');
    });
  });
});
