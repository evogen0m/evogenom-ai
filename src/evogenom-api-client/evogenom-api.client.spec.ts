import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';
import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EvogenomApiClient } from './evogenom-api.client';
import {
  ProductType,
  UserOrderFragment,
  UserResultFragment,
} from './generated/request';

// Mock data for fragments
const mockOrderPackage1: UserOrderFragment = {
  id: 'op1',
  __typename: 'OrderPackage',
  package: {
    id: 'pkg1',
    name: 'Test Package 1',
    productCode: 101,
    productType: ProductType.Main,
    createdAt: new Date().toISOString(),
    isDiscontinued: false,
    __typename: 'Package',
  },
};
const mockOrderPackage2: UserOrderFragment = {
  id: 'op2',
  __typename: 'OrderPackage',
  package: {
    id: 'pkg2',
    name: 'Test Package 2',
    productCode: 102,
    productType: ProductType.Extra,
    createdAt: new Date().toISOString(),
    isDiscontinued: null,
    __typename: 'Package',
  },
};
const mockResult1: UserResultFragment = {
  id: 'result1',
  name: 'Result One',
  description: 'Desc 1',
  createdAt: new Date().toISOString(),
  sampleResultsId: 's1',
  productResultsId: 'p1',
  value: 1,
  __typename: 'Result',
};
const mockResult2: UserResultFragment = {
  id: 'result2',
  name: 'Result Two',
  description: 'Desc 2',
  createdAt: new Date().toISOString(),
  sampleResultsId: 's2',
  productResultsId: 'p2',
  value: 2,
  __typename: 'Result',
};

const mockProduct = { id: 'product1', __typename: 'Product' };
const mockProduct2 = { id: 'product2', __typename: 'Product' };

const MOCK_API_URL = 'http://mock-api.com/graphql';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_USER_ID = 'mock-user-id';

describe('EvogenomApiClient', () => {
  let apiClient: EvogenomApiClient;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'EVOGENOM_API_URL') {
          return MOCK_API_URL;
        }
        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    apiClient = new EvogenomApiClient(mockConfigService as ConfigService);

    if (!nock.isActive()) {
      nock.activate();
    }
    nock.cleanAll();
  });

  afterEach(() => {
    nock.restore();
    vi.restoreAllMocks();
  });

  describe('when initializing the client', () => {
    it('should retrieve the API URL from ConfigService', () => {
      expect(apiClient.getApiUrl()).toBe(MOCK_API_URL);
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
        'EVOGENOM_API_URL',
      );
    });

    it('should create a GraphQLClient with correct URL and headers', () => {
      const client = apiClient.getClient(MOCK_ACCESS_TOKEN);
      expect(client).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('when fetching user orders', () => {
    it('should return flattened user order packages from a single API call', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('GetUserOrdersAndPackages') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            orderByOwner: {
              items: [
                {
                  id: 'order1',
                  packages: {
                    items: [mockOrderPackage1],
                    nextToken: null,
                  },
                },
                {
                  id: 'order2',
                  packages: {
                    items: [mockOrderPackage2],
                    nextToken: null,
                  },
                },
              ],
              nextToken: 'should-be-ignored-token',
            },
          },
        });

      const orders = await apiClient.getUserOrders(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(orders).toEqual([mockOrderPackage1, mockOrderPackage2]);
      expect(scope.isDone()).toBe(true);
    });

    it('should handle orders with multiple packages within the single response', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post(
          '',
          (body) =>
            body.query.includes('GetUserOrdersAndPackages') &&
            body.variables.nextToken === null,
        )
        .reply(200, {
          data: {
            orderByOwner: {
              items: [
                {
                  id: 'order1',
                  packages: {
                    items: [mockOrderPackage1, mockOrderPackage2],
                    nextToken: null,
                  },
                },
              ],
              nextToken: null,
            },
          },
        });

      const orders = await apiClient.getUserOrders(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );
      expect(orders).toEqual([mockOrderPackage1, mockOrderPackage2]);
      expect(scope.isDone()).toBe(true);
    });

    it('should return an empty array when no orders are found in the single response', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('GetUserOrdersAndPackages'))
        .reply(200, {
          data: {
            orderByOwner: {
              items: [],
              nextToken: null,
            },
          },
        });

      const orders = await apiClient.getUserOrders(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );
      expect(orders).toEqual([]);
      expect(scope.isDone()).toBe(true);
    });

    it('should throw an error if the API call fails', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('GetUserOrdersAndPackages'))
        .reply(500, { errors: [{ message: 'Internal Server Error' }] });

      await expect(
        apiClient.getUserOrders(MOCK_USER_ID, MOCK_ACCESS_TOKEN),
      ).rejects.toThrow('[userId: mock-user-id] Failed to fetch user orders:');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('when fetching user results', () => {
    it('should return user results from a single API call', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserResults') &&
            body.query.includes('resultByOwner') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            resultByOwner: {
              items: [mockResult1, mockResult2],
              nextToken: 'should-be-ignored-res-token',
            },
          },
        });

      const results = await apiClient.getUserResults(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(results).toEqual([mockResult1, mockResult2]);
      expect(scope.isDone()).toBe(true);
    });

    it('should return an empty array when no results are found in the single response', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post(
          '',
          (body) =>
            body.query.includes('ListUserResults') &&
            body.query.includes('resultByOwner') &&
            body.variables.nextToken === null,
        )
        .reply(200, {
          data: {
            resultByOwner: {
              items: [],
              nextToken: null,
            },
          },
        });

      const results = await apiClient.getUserResults(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );
      expect(results).toEqual([]);
      expect(scope.isDone()).toBe(true);
    });

    it('should throw an error if the result API call fails', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post(
          '',
          (body) =>
            body.query.includes('ListUserResults') &&
            body.query.includes('resultByOwner'),
        )
        .reply(500, { errors: [{ message: 'Results Error' }] });

      await expect(
        apiClient.getUserResults(MOCK_USER_ID, MOCK_ACCESS_TOKEN),
      ).rejects.toThrow('[userId: mock-user-id] Failed to fetch user results:');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('when fetching all products', () => {
    it('should return products from a single API call', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListProducts') &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            listProducts: {
              items: [mockProduct, mockProduct2],
              nextToken: 'ignored-prod-token',
            },
          },
        });

      const products = await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);

      expect(products).toEqual([mockProduct, mockProduct2]);
      expect(scope.isDone()).toBe(true);
    });

    it('should return an empty array when no products are found in the single response', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post(
          '',
          (body) =>
            body.query.includes('ListProducts') &&
            body.variables.nextToken === null,
        )
        .reply(200, {
          data: {
            listProducts: {
              items: [],
              nextToken: null,
            },
          },
        });

      const products = await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);
      expect(products).toEqual([]);
      expect(scope.isDone()).toBe(true);
    });

    it('should throw an error if the product API call fails', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .reply(500, { errors: [{ message: 'Product Error' }] });

      await expect(apiClient.getAllProducts(MOCK_ACCESS_TOKEN)).rejects.toThrow(
        'Failed to fetch products:',
      );
      expect(scope.isDone()).toBe(true);
    });

    it('should handle GraphQL errors with partial data and filter out null packages', async () => {
      const mockProductWithValidPackage = {
        id: 'prod1',
        name: 'Product 1',
        productCode: '101',
        packages: {
          items: [
            {
              packageID: 'pkg1',
              package: {
                id: 'pkg1',
                isDiscontinued: false,
              },
            },
            {
              packageID: 'pkg2',
              package: null, // This will be filtered out
            },
          ],
        },
      };

      const mockProductWithAllNullPackages = {
        id: 'prod2',
        name: 'Product 2',
        productCode: '102',
        packages: {
          items: [
            {
              packageID: 'pkg3',
              package: null,
            },
          ],
        },
      };

      const graphqlErrors = [
        {
          path: ['listProducts', 'items', 0, 'packages', 'items', 1, 'package'],
          message:
            "Cannot return null for non-nullable type: 'Package' within parent 'PackageProduct' (/listProducts/items[0]/packages/items[1]/package)",
        },
        {
          path: ['listProducts', 'items', 1, 'packages', 'items', 0, 'package'],
          message:
            "Cannot return null for non-nullable type: 'Package' within parent 'PackageProduct' (/listProducts/items[1]/packages/items[0]/package)",
        },
      ];

      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .reply(200, {
          data: {
            listProducts: {
              items: [
                mockProductWithValidPackage,
                mockProductWithAllNullPackages,
              ],
              nextToken: null,
            },
          },
          errors: graphqlErrors,
        });

      const products = await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);

      // Should return both products, but with null packages filtered out
      expect(products).toHaveLength(2);
      expect(products[0].packages?.items).toHaveLength(1); // Only 1 valid package
      expect(products[0].packages?.items?.[0]?.package).toBeDefined();
      expect(products[1].packages?.items).toHaveLength(0); // All packages were null
      expect(scope.isDone()).toBe(true);
    });

    it('should throw an error if no partial data is available with GraphQL errors', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .reply(200, {
          errors: [{ message: 'Invalid query' }],
          // No data field at all
        });

      await expect(apiClient.getAllProducts(MOCK_ACCESS_TOKEN)).rejects.toThrow(
        'Failed to fetch products:',
      );
      expect(scope.isDone()).toBe(true);
    });

    it('should handle the case where error response structure is malformed', async () => {
      const mockError = new Error('Network error');
      // Simulate an error without the expected response structure
      (mockError as any).response = { someOtherField: 'value' };

      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .replyWithError(mockError);

      await expect(apiClient.getAllProducts(MOCK_ACCESS_TOKEN)).rejects.toThrow(
        'Failed to fetch products:',
      );
      expect(scope.isDone()).toBe(true);
    });

    it('should log warnings about pagination when nextToken is present in error response', async () => {
      const mockProduct = {
        id: 'prod1',
        name: 'Product 1',
        productCode: '101',
        packages: {
          items: [
            {
              packageID: 'pkg1',
              package: {
                id: 'pkg1',
                isDiscontinued: false,
              },
            },
          ],
        },
      };

      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .reply(200, {
          data: {
            listProducts: {
              items: [mockProduct],
              nextToken: 'some-next-token',
            },
          },
          errors: [
            {
              message:
                "Cannot return null for non-nullable type: 'Package' within parent 'PackageProduct'",
            },
          ],
        });

      const loggerWarnSpy = vi.spyOn(apiClient.logger, 'warn');

      await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);

      // Should log both the GraphQL errors and the pagination warning
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'GraphQL errors occurred while fetching products',
        ),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Found 1 products with null package references',
        ),
      );

      expect(scope.isDone()).toBe(true);
    });
  });
});
