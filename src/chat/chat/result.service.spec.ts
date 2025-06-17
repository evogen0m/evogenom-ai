/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentfulApiClient } from '../../contentful/contentful-api-client';
import {
  ProductFieldsFragment as ContentfulProduct,
  ResultRowFieldsFragment as ContentfulResultRow,
} from '../../contentful/generated/types';
import { EvogenomApiClient } from '../../evogenom-api-client/evogenom-api.client';
import {
  ProductFragment as EvogenomProduct,
  UserResultFragment as EvogenomUserResult,
} from '../../evogenom-api-client/generated/request';
import { MappedUserResult, ResultService } from './result.service';

vi.mock('@sentry/nestjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('ResultService', () => {
  let service: ResultService;
  let evogenomApiClient: EvogenomApiClient;
  let contentfulApiClient: ContentfulApiClient;

  const mockUserId = 'user-test-id';
  const mockEvogenomApiToken = 'evg-token-test';

  const mockEvgUserResults: EvogenomUserResult[] = [
    {
      id: 'evg-res-1',
      productResultsId: 'evg-prod-1',
      value: 1,
      name: 'EVG Result 1 (Prod 1, Val 1)',
      description: 'Desc 1',
      createdAt: 'date1',
      sampleResultsId: 'sample1',
    },
    {
      id: 'evg-res-2',
      productResultsId: 'evg-prod-2',
      value: 2,
      name: 'EVG Result 2 (Prod 2, Val 2)',
      description: 'Desc 2',
      createdAt: 'date2',
      sampleResultsId: 'sample2',
    },
    {
      id: 'evg-res-3',
      productResultsId: 'evg-prod-1',
      value: 99,
      name: 'EVG Result 3 (Prod 1, Val 99)',
      description: 'Desc 3',
      createdAt: 'date3',
      sampleResultsId: 'sample3',
    },
    {
      id: 'evg-res-4',
      productResultsId: 'evg-prod-no-cf-product',
      value: 1,
      name: 'EVG Result 4 (Prod No CF, Val 1)',
      description: 'Desc 4',
      createdAt: 'date4',
      sampleResultsId: 'sample4',
    },
  ];

  const mockEvgProducts: EvogenomProduct[] = [
    {
      id: 'evg-prod-1',
      name: 'Evogenom Product One',
      productCode: '101',
      packages: {
        items: [
          {
            packageID: 'pkg-1',
            package: {
              id: 'pkg-1',
              isDiscontinued: false,
            },
          },
        ],
      },
    },
    {
      id: 'evg-prod-2',
      name: 'Evogenom Product Two',
      productCode: '102',
      packages: {
        items: [
          {
            packageID: 'pkg-2',
            package: {
              id: 'pkg-2',
              isDiscontinued: false,
            },
          },
        ],
      },
    },
    {
      id: 'evg-prod-no-cf-product',
      name: 'Evogenom Product No CF Match',
      productCode: '103',
      packages: {
        items: [
          {
            packageID: 'pkg-3',
            package: {
              id: 'pkg-3',
              isDiscontinued: false,
            },
          },
        ],
      },
    },
    {
      id: 'evg-prod-3',
      name: 'Evogenom Product Three',
      productCode: '104',
      packages: {
        items: [
          {
            packageID: 'pkg-4',
            package: {
              id: 'pkg-4',
              isDiscontinued: false,
            },
          },
        ],
      },
    },
  ];

  const mockCfResultRows: ContentfulResultRow[] = [
    {
      productCode: '101',
      result: 1,
      resultText: 'CF Text for 101, Value 1',
      sys: { id: 'cf-rr-1' },
      __typename: 'ResultRow',
    } as ContentfulResultRow,
    {
      productCode: '102',
      result: 2,
      resultText: 'CF Text for 102, Value 2',
      sys: { id: 'cf-rr-2' },
      __typename: 'ResultRow',
    } as ContentfulResultRow,
    {
      productCode: '104',
      result: 1,
      resultText: null,
      sys: { id: 'cf-rr-3' },
      __typename: 'ResultRow',
    } as ContentfulResultRow,
    {
      productCode: '101',
      result: 99,
      resultText: 'CF Text for 101, Value 99',
      sys: { id: 'cf-rr-4' },
      __typename: 'ResultRow',
    } as ContentfulResultRow,
  ];

  const mockCfProducts: ContentfulProduct[] = [
    {
      productCode: 101,
      name: 'Contentful Product 101 Name',
      sys: { id: 'cf-p-1' },
      __typename: 'Product',
    } as ContentfulProduct,
    {
      productCode: 102,
      name: 'Contentful Product 102 Name',
      sys: { id: 'cf-p-2' },
      __typename: 'Product',
    } as ContentfulProduct,
    {
      productCode: 104,
      name: null,
      sys: { id: 'cf-p-3' },
      __typename: 'Product',
    } as ContentfulProduct,
  ];

  beforeEach(async () => {
    vi.clearAllMocks();

    evogenomApiClient = {
      getUserResults: vi.fn(),
      getAllProducts: vi.fn(),
    } as unknown as EvogenomApiClient;

    contentfulApiClient = {
      getResults: vi.fn(),
      getProducts: vi.fn(),
    } as unknown as ContentfulApiClient;

    vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue(
      mockEvgUserResults,
    );
    vi.spyOn(evogenomApiClient, 'getAllProducts').mockResolvedValue(
      mockEvgProducts,
    );
    vi.spyOn(contentfulApiClient, 'getResults').mockResolvedValue(
      mockCfResultRows,
    );
    vi.spyOn(contentfulApiClient, 'getProducts').mockResolvedValue(
      mockCfProducts,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        { provide: EvogenomApiClient, useValue: evogenomApiClient },
        { provide: ContentfulApiClient, useValue: contentfulApiClient },
      ],
    }).compile();

    service = module.get<ResultService>(ResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getResultRowsByProductCode', () => {
    it('should return empty object if no product codes provided', async () => {
      const result = await service.getResultRowsByProductCode([]);
      expect(contentfulApiClient.getResults).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should fetch and format result rows from Contentful', async () => {
      const productCodes = ['101', '102'];
      const result = await service.getResultRowsByProductCode(productCodes);
      expect(contentfulApiClient.getResults).toHaveBeenCalledWith(productCodes);
      expect(result['101']?.[1]).toEqual(
        mockCfResultRows.find((r) => r.productCode === '101' && r.result === 1),
      );
      expect(result['102']?.[2]).toEqual(
        mockCfResultRows.find((r) => r.productCode === '102' && r.result === 2),
      );
    });

    it('should filter out result rows with null productCode or result', async () => {
      const partialCfResultRows = [
        { ...mockCfResultRows[0], productCode: null },
        { ...mockCfResultRows[1], result: null },
        mockCfResultRows[0],
      ] as ContentfulResultRow[];
      vi.spyOn(contentfulApiClient, 'getResults').mockResolvedValue(
        partialCfResultRows,
      );
      const result = await service.getResultRowsByProductCode(['101']);
      expect(result['101']?.[1]).toEqual(mockCfResultRows[0]);
      expect(Object.keys(result['101'] ?? {}).length).toBe(1);
    });
  });

  describe('getProductByProductCode', () => {
    it('should return empty object if no product codes provided', async () => {
      const result = await service.getProductByProductCode([]);
      expect(contentfulApiClient.getProducts).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should fetch and format products from Contentful', async () => {
      const productCodes = ['101', '102'];
      const result = await service.getProductByProductCode(productCodes);
      expect(contentfulApiClient.getProducts).toHaveBeenCalledWith(
        productCodes,
      );
      expect(result['101']).toEqual(
        mockCfProducts.find((p) => String(p.productCode) === '101'),
      );
      expect(result['102']).toEqual(
        mockCfProducts.find((p) => String(p.productCode) === '102'),
      );
    });

    it('should filter out products with null productCode', async () => {
      const partialCfProducts = [
        { ...mockCfProducts[0], productCode: null },
        mockCfProducts[1],
      ] as ContentfulProduct[];
      vi.spyOn(contentfulApiClient, 'getProducts').mockResolvedValue(
        partialCfProducts,
      );
      const result = await service.getProductByProductCode(['102']);
      expect(result['102']).toEqual(mockCfProducts[1]);
      expect(Object.keys(result).length).toBe(1);
    });
  });

  describe('getMappedUserResults', () => {
    it('should return empty array if no Evogenom user results', async () => {
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([]);
      const result = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(result).toEqual([]);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should correctly map results when data is present and filter those with missing CF Product', async () => {
      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(results.length).toBe(3);
      expect(results).toContainEqual<MappedUserResult>({
        finalProductName: 'Contentful Product 101 Name',
        interpretationText: 'CF Text for 101, Value 1',
      });
      expect(results).toContainEqual<MappedUserResult>({
        finalProductName: 'Contentful Product 102 Name',
        interpretationText: 'CF Text for 102, Value 2',
      });
      expect(results).toContainEqual<MappedUserResult>({
        finalProductName: 'Contentful Product 101 Name',
        interpretationText: 'CF Text for 101, Value 99',
      });

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining(
          'Contentful product missing for productCode: 103',
        ),
        expect.objectContaining({
          level: 'warning',
          extra: expect.objectContaining({
            productCode: '103',
            evogenomProductName: 'Evogenom Product No CF Match',
          }),
        }),
      );
    });

    it('should filter result and log to Sentry if Contentful product is missing', async () => {
      const userResultMissingCfProduct = mockEvgUserResults.find(
        (ur) => ur.id === 'evg-res-4',
      )!;
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        userResultMissingCfProduct,
      ]);

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(0);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Contentful product missing for productCode: 103 (Evogenom product name: Evogenom Product No CF Match)',
        expect.objectContaining({
          level: 'warning',
          extra: {
            productCode: '103',
            evogenomProductName: 'Evogenom Product No CF Match',
          },
        }),
      );
    });

    it('should filter result and log to Sentry if Contentful result row is missing', async () => {
      const userResultMissingCfRow: EvogenomUserResult = {
        id: 'evg-res-missing-cf-row',
        productResultsId: 'evg-prod-1',
        value: 50,
        name: 'EVG Result Missing CF Row',
        description: 'Desc missing',
        createdAt: 'dateMissing',
        sampleResultsId: 'sampleMissing',
      };
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        userResultMissingCfRow,
      ]);

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(0);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Contentful result row missing for productCode: 101, userValue: 50 (Evogenom product name: Evogenom Product One, Contentful product name: Contentful Product 101 Name)',
        expect.objectContaining({
          level: 'warning',
          extra: {
            productCode: '101',
            userValue: 50,
            evogenomProductName: 'Evogenom Product One',
            contentfulProductName: 'Contentful Product 101 Name',
          },
        }),
      );
    });

    it('should filter result and log to Sentry if Contentful product name is missing', async () => {
      const evgUserRes: EvogenomUserResult = {
        id: 'evg-res-cf-prod-null-name',
        productResultsId: 'evg-prod-3',
        value: 1,
        name: 'EVG User Res CF Prod Null Name',
        description: 'd',
        createdAt: 'c',
        sampleResultsId: 's',
      };
      const specificCfResultRows = mockCfResultRows.map((r) =>
        r.productCode === '104' && r.result === 1
          ? { ...r, resultText: 'Valid text for 104,1' }
          : r,
      );
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        evgUserRes,
      ]);
      vi.spyOn(contentfulApiClient, 'getResults').mockResolvedValue(
        specificCfResultRows as ContentfulResultRow[],
      );

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(0);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Contentful product name missing for productCode: 104 (Evogenom product name: Evogenom Product Three). User value: 1. Result row text: Valid text for 104,1',
        expect.objectContaining({
          level: 'warning',
          extra: {
            productCode: '104',
            userValue: 1,
            evogenomProductName: 'Evogenom Product Three',
            resultRowTextAvailable: true,
          },
        }),
      );
    });

    it('should filter result and log to Sentry if Contentful resultText is missing', async () => {
      const evgUserRes: EvogenomUserResult = {
        id: 'evg-res-cf-text-null',
        productResultsId: 'evg-prod-3',
        value: 1,
        name: 'EVG User Res CF Text Null',
        description: 'd',
        createdAt: 'c',
        sampleResultsId: 's',
      };
      const specificCfProducts = mockCfProducts.map((p) =>
        p.productCode === 104 ? { ...p, name: 'CF Product 104 Valid Name' } : p,
      );
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        evgUserRes,
      ]);
      vi.spyOn(contentfulApiClient, 'getProducts').mockResolvedValue(
        specificCfProducts as ContentfulProduct[],
      );

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(0);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Contentful result text missing for productCode: 104, userValue: 1 (Contentful product name: CF Product 104 Valid Name, Evogenom product name: Evogenom Product Three)',
        expect.objectContaining({
          level: 'warning',
          extra: {
            productCode: '104',
            userValue: 1,
            contentfulProductName: 'CF Product 104 Valid Name',
            evogenomProductName: 'Evogenom Product Three',
          },
        }),
      );
    });

    it('should handle EvogenomUserResult with null productResultsId gracefully', async () => {
      const userResultWithNullProdId = {
        id: 'evg-res-5',
        productResultsId: null,
        value: 1,
        name: 'EVG Result 5',
        description: 'Desc 5',
        createdAt: 'date5',
        sampleResultsId: 'sample5',
      };
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        ...mockEvgUserResults,
        userResultWithNullProdId as unknown as EvogenomUserResult,
      ]);
      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(results.length).toBe(3);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle EvogenomUserResult with null value gracefully', async () => {
      const userResultWithInvalidValue = {
        id: 'evg-res-6',
        productResultsId: 'evg-prod-1',
        value: null,
        name: 'EVG Result 6',
        description: 'Desc 6',
        createdAt: 'date6',
        sampleResultsId: 'sample6',
      };
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        ...mockEvgUserResults,
        userResultWithInvalidValue as unknown as EvogenomUserResult,
      ]);
      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(results.length).toBe(3);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle EvogenomProduct with null productCode gracefully', async () => {
      const productWithInvalidCode = {
        id: 'evg-prod-no-code',
        name: 'Evogenom Product No Code',
        productCode: null,
        packages: {
          items: [
            {
              packageID: 'pkg-invalid',
              package: {
                id: 'pkg-invalid',
                isDiscontinued: false,
              },
            },
          ],
        },
      };
      const userResultUsingProductWithInvalidCode = {
        id: 'evg-res-7',
        productResultsId: 'evg-prod-no-code',
        value: 1,
        name: 'EVG Result 7',
        description: 'Desc 7',
        createdAt: 'date7',
        sampleResultsId: 'sample7',
      };
      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        ...mockEvgUserResults,
        userResultUsingProductWithInvalidCode as EvogenomUserResult,
      ]);
      vi.spyOn(evogenomApiClient, 'getAllProducts').mockResolvedValue([
        ...mockEvgProducts,
        productWithInvalidCode as unknown as EvogenomProduct,
      ]);
      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );
      expect(results.length).toBe(3);
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    });

    it('should correctly map when multiple Contentful result rows exist for the same productCode and different result values', async () => {
      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(3);

      const resultForVal1 = results.find(
        (r) => r.interpretationText === 'CF Text for 101, Value 1',
      );
      expect(resultForVal1).toBeDefined();
      expect(resultForVal1?.finalProductName).toBe(
        'Contentful Product 101 Name',
      );

      const resultForVal99 = results.find(
        (r) => r.interpretationText === 'CF Text for 101, Value 99',
      );
      expect(resultForVal99).toBeDefined();
      expect(resultForVal99?.finalProductName).toBe(
        'Contentful Product 101 Name',
      );

      expect(results).toContainEqual<MappedUserResult>({
        finalProductName: 'Contentful Product 102 Name',
        interpretationText: 'CF Text for 102, Value 2',
      });

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining(
          'Contentful product missing for productCode: 103',
        ),
        expect.objectContaining({
          level: 'warning',
          extra: expect.objectContaining({ productCode: '103' }),
        }),
      );
    });

    it('should filter out results for products with only discontinued packages', async () => {
      const productWithDiscontinuedPackage = {
        id: 'evg-prod-discontinued',
        name: 'Discontinued Product',
        productCode: '105',
        packages: {
          items: [
            {
              packageID: 'pkg-disc-1',
              package: {
                id: 'pkg-disc-1',
                isDiscontinued: true,
              },
            },
            {
              packageID: 'pkg-disc-2',
              package: {
                id: 'pkg-disc-2',
                isDiscontinued: true,
              },
            },
          ],
        },
      };
      const userResultForDiscontinuedProduct = {
        id: 'evg-res-discontinued',
        productResultsId: 'evg-prod-discontinued',
        value: 1,
        name: 'Result for Discontinued',
        description: 'Desc discontinued',
        createdAt: 'date-disc',
        sampleResultsId: 'sample-disc',
      };

      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        userResultForDiscontinuedProduct as EvogenomUserResult,
      ]);
      vi.spyOn(evogenomApiClient, 'getAllProducts').mockResolvedValue([
        productWithDiscontinuedPackage as unknown as EvogenomProduct,
      ]);

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(0);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should include results for products with at least one active package', async () => {
      const productWithMixedPackages = {
        id: 'evg-prod-mixed',
        name: 'Mixed Package Product',
        productCode: '106',
        packages: {
          items: [
            {
              packageID: 'pkg-disc',
              package: {
                id: 'pkg-disc',
                isDiscontinued: true,
              },
            },
            {
              packageID: 'pkg-active',
              package: {
                id: 'pkg-active',
                isDiscontinued: false,
              },
            },
          ],
        },
      };
      const userResultForMixedProduct = {
        id: 'evg-res-mixed',
        productResultsId: 'evg-prod-mixed',
        value: 1,
        name: 'Result for Mixed',
        description: 'Desc mixed',
        createdAt: 'date-mixed',
        sampleResultsId: 'sample-mixed',
      };

      const cfProduct = {
        productCode: 106,
        name: 'CF Product 106',
        sys: { id: 'cf-p-106' },
        __typename: 'Product',
      } as ContentfulProduct;

      const cfResultRow = {
        productCode: '106',
        result: 1,
        resultText: 'CF Text for 106, Value 1',
        sys: { id: 'cf-rr-106' },
        __typename: 'ResultRow',
      } as ContentfulResultRow;

      vi.spyOn(evogenomApiClient, 'getUserResults').mockResolvedValue([
        userResultForMixedProduct as EvogenomUserResult,
      ]);
      vi.spyOn(evogenomApiClient, 'getAllProducts').mockResolvedValue([
        productWithMixedPackages as unknown as EvogenomProduct,
      ]);
      vi.spyOn(contentfulApiClient, 'getProducts').mockResolvedValue([
        cfProduct,
      ]);
      vi.spyOn(contentfulApiClient, 'getResults').mockResolvedValue([
        cfResultRow,
      ]);

      const results = await service.getMappedUserResults(
        mockUserId,
        mockEvogenomApiToken,
      );

      expect(results.length).toBe(1);
      expect(results[0]).toEqual({
        finalProductName: 'CF Product 106',
        interpretationText: 'CF Text for 106, Value 1',
      });
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
