/* eslint-disable @typescript-eslint/unbound-method */
import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingModuleWithDb } from '../../../test/utils';
import { CognitoService } from '../../aws/cognito.service';
import { ContentfulApiClient } from '../../contentful/contentful-api-client';
import {
  ProductFieldsFragment,
  ResultRowFieldsFragment,
} from '../../contentful/generated/types';
import { DrizzleInstanceType, users } from '../../db';
import { DRIZZLE_INSTANCE } from '../../db/drizzle.provider';
import { EvogenomApiClient } from '../../evogenom-api-client/evogenom-api.client';
import {
  ProductFragment,
  UserResultFragment,
} from '../../evogenom-api-client/generated/request';
import { ChatContextMetadata, PromptService } from './prompt.service';

describe('PromptService', () => {
  let service: PromptService;
  let evogenomApiClient: EvogenomApiClient;
  let contentfulApiClient: ContentfulApiClient;
  let cognitoService: CognitoService;
  let dbClient: DrizzleInstanceType;

  // Mock data
  const mockUserId = randomUUID();
  const mockEvogenomApiToken = 'token-123';
  const mockChatId = randomUUID();
  const mockLanguageCode = 'en';

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

  // Update mock results to match GraphQL response format
  const mockResultRows: ResultRowFieldsFragment[] = [
    {
      productCode: '101',
      resultText: 'Result for Product One',
      tip: null,
      result: null,
      classification: null,
      fact: null,
      science: null,
      sys: { id: 'result-sys-1', __typename: 'Sys' },
      __typename: 'ResultRow',
    } as ResultRowFieldsFragment,
    {
      productCode: '102',
      resultText: 'Result for Product Two',
      tip: null,
      result: null,
      classification: null,
      fact: null,
      science: null,
      sys: { id: 'result-sys-2', __typename: 'Sys' },
      __typename: 'ResultRow',
    } as ResultRowFieldsFragment,
  ];

  // Update mock products to match GraphQL response format
  const mockProducts2: ProductFieldsFragment[] = [
    {
      productCode: 101,
      name: 'Product One',
      sys: { id: 'product-sys-1', __typename: 'Sys' },
      __typename: 'Product',
    } as ProductFieldsFragment,
    {
      productCode: 102,
      name: 'Product Two',
      sys: { id: 'product-sys-2', __typename: 'Sys' },
      __typename: 'Product',
    } as ProductFieldsFragment,
  ];

  // Default mock ChatContextMetadata for tests
  const defaultChatContextMetadata: ChatContextMetadata = {
    currentMessageCount: 1,
    totalHistoryCount: 1,
    userTimeZone: 'UTC',
    scheduledFollowups: [],
    userProfile: null,
    isOnboarded: true,
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

    // Mock CognitoService
    cognitoService = {
      getUserLanguage: vi.fn().mockResolvedValue(mockLanguageCode),
    } as unknown as CognitoService;

    const module: TestingModule = await createTestingModuleWithDb({
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
        {
          provide: CognitoService,
          useValue: cognitoService,
        },
      ],
    }).compile();

    service = module.get<PromptService>(PromptService);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    // Ensure a mock user exists in the database before each test
    // Sticking to only fields known to be in the base `users` table for now
    await dbClient
      .insert(users)
      .values({ id: mockUserId, timeZone: 'UTC' })
      .onConflictDoNothing();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemPrompt', () => {
    it('should fetch user results and products from Evogenom API', async () => {
      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

      expect(evogenomApiClient.getUserResults).toHaveBeenCalledWith(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(evogenomApiClient.getAllProducts).toHaveBeenCalledWith(
        mockEvogenomApiToken,
      );
    });

    it('should fetch user language from CognitoService', async () => {
      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );
      expect(cognitoService.getUserLanguage).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch result rows and products from Contentful', async () => {
      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

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

      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should include chat context metadata when provided', async () => {
      // This test might need to be re-thought as ChatContextMetadata is now internal
      // For now, we'll check if formatSystemPrompt is called with internally generated metadata
      const spy = vi.spyOn(service, 'formatSystemPrompt');

      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object), // results
        expect.any(Object), // products
        expect.objectContaining({
          // Internally generated metadata
          currentMessageCount: expect.any(Number),
          totalHistoryCount: expect.any(Number),
          userTimeZone: expect.any(String),
          scheduledFollowups: expect.any(Array),
          userProfile: null,
          isOnboarded: false,
        }),
        mockLanguageCode,
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
      const results: Record<string, ResultRowFieldsFragment> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
          tip: null,
          result: null,
          classification: null,
          fact: null,
          science: null,
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'ResultRow',
        } as ResultRowFieldsFragment,
      };

      const products: Record<string, ProductFieldsFragment> = {
        '101': {
          productCode: 101,
          name: 'Product One',
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'Product',
        } as ProductFieldsFragment,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        defaultChatContextMetadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('Product One: Result for Product One');
      expect(prompt).toContain('# Your Role & Purpose');
    });

    it('should include chat context metadata when provided', () => {
      const results: Record<string, ResultRowFieldsFragment> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
          tip: null,
          result: null,
          classification: null,
          fact: null,
          science: null,
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'ResultRow',
        } as ResultRowFieldsFragment,
      };

      const products: Record<string, ProductFieldsFragment> = {
        '101': {
          productCode: 101,
          name: 'Product One',
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'Product',
        } as ProductFieldsFragment,
      };

      const metadata: ChatContextMetadata = {
        currentMessageCount: 5,
        totalHistoryCount: 10,
        userTimeZone: 'UTC',
        scheduledFollowups: [],
        userProfile: null,
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        metadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('Current conversation: 5 messages');
      expect(prompt).toContain('Total history: 10 messages');
      expect(prompt).toContain(
        'Note: There are previous conversations not included in this context',
      );
    });

    it('should handle content wrapped in ContentfulWrapper', () => {
      const results: Record<string, ResultRowFieldsFragment> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
          tip: null,
          result: null,
          classification: null,
          fact: null,
          science: null,
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'ResultRow',
        } as ResultRowFieldsFragment,
      };

      const products: Record<string, ProductFieldsFragment> = {
        '101': {
          productCode: 101,
          name: { values: 'Product One Wrapped' },
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'Product',
        } as unknown as ProductFieldsFragment,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        defaultChatContextMetadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('Product One Wrapped');
    });

    it('should skip products or results that are not found', () => {
      const results: Record<string, ResultRowFieldsFragment> = {
        '101': {
          productCode: '101',
          resultText: 'Result for Product One',
          tip: null,
          result: null,
          classification: null,
          fact: null,
          science: null,
          sys: { id: 'sys-id-1', __typename: 'Sys' },
          __typename: 'ResultRow',
        } as ResultRowFieldsFragment,
      };

      const products: Record<string, ProductFieldsFragment> = {
        '102': {
          productCode: 102,
          name: 'Product Two',
          sys: { id: 'sys-id-2', __typename: 'Sys' },
          __typename: 'Product',
        } as ProductFieldsFragment,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        defaultChatContextMetadata,
        mockLanguageCode,
      );

      expect(prompt).not.toContain('Product One');
      expect(prompt).not.toContain('Product Two');
    });

    it('should include user profile information when available', () => {
      const results: Record<string, ResultRowFieldsFragment> = {};
      const products: Record<string, ProductFieldsFragment> = {};
      const metadata: ChatContextMetadata = {
        currentMessageCount: 1,
        totalHistoryCount: 1,
        userTimeZone: 'UTC',
        scheduledFollowups: [],
        userProfile: {
          name: 'Test User',
          age: 30,
          gender: 'Male',
          height: 180,
          weight: 75,
          work: 'Engineer',
          physicalActivity: 'Moderate',
        },
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        metadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('# User Profile');
      expect(prompt).toContain('- Name: Test User');
      expect(prompt).toContain('- Age: 30');
      expect(prompt).toContain('- Gender: Male');
      expect(prompt).toContain('- Height: 180');
      expect(prompt).toContain('- Weight: 75');
      expect(prompt).toContain('- Work: Engineer');
      expect(prompt).toContain('- PhysicalActivity: Moderate');
    });

    it('should not include user profile section if profile is null', () => {
      const results: Record<string, ResultRowFieldsFragment> = {};
      const products: Record<string, ProductFieldsFragment> = {};
      const metadata: ChatContextMetadata = {
        currentMessageCount: 1,
        totalHistoryCount: 1,
        userTimeZone: 'UTC',
        scheduledFollowups: [],
        userProfile: null,
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        metadata,
        mockLanguageCode,
      );
      expect(prompt).not.toContain('# User Profile');
    });

    it('should not include user profile section if profile is empty object', () => {
      const results: Record<string, ResultRowFieldsFragment> = {};
      const products: Record<string, ProductFieldsFragment> = {};
      const metadata: ChatContextMetadata = {
        currentMessageCount: 1,
        totalHistoryCount: 1,
        userTimeZone: 'UTC',
        scheduledFollowups: [],
        userProfile: {},
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        metadata,
        mockLanguageCode,
      );
      expect(prompt).not.toContain('# User Profile');
    });

    it('should only include non-empty profile fields', () => {
      const results: Record<string, ResultRowFieldsFragment> = {};
      const products: Record<string, ProductFieldsFragment> = {};
      const metadata: ChatContextMetadata = {
        currentMessageCount: 1,
        totalHistoryCount: 1,
        userTimeZone: 'UTC',
        scheduledFollowups: [],
        userProfile: {
          name: 'Test User',
          age: undefined,
          gender: '',
          height: undefined,
          weight: 75,
        },
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        results,
        products,
        metadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('# User Profile');
      expect(prompt).toContain('- Name: Test User');
      expect(prompt).toContain('- Weight: 75');
      expect(prompt).not.toContain('- Age:');
      expect(prompt).not.toContain('- Gender:');
      expect(prompt).not.toContain('- Height:');
    });
  });
});
