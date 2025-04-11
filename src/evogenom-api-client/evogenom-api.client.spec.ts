import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';
import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EvogenomApiClient } from './evogenom-api.client';

// Mock data (replace with actual fragments if needed, or keep simple for structure)
const mockOrder = { id: 'order1', __typename: 'OrderPackage' };
const mockResult = { id: 'result1', __typename: 'Result' };
const mockProduct = { id: 'product1', __typename: 'Product' };

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

    // Ensure nock is clean before each test
    if (!nock.isActive()) {
      nock.activate();
    }
    nock.cleanAll();
  });

  afterEach(() => {
    nock.restore(); // Restore HTTP intercepting
    vi.restoreAllMocks(); // Restore mocks
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
      // Note: graphql-request doesn't directly expose endpoint/headers after creation easily,
      // We test this indirectly via nock matching headers/url later.
    });
  });

  describe('when fetching user orders', () => {
    it('should return user orders without pagination', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserOrders') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            listOrderPackages: {
              items: [mockOrder],
              nextToken: null,
            },
          },
        });

      const orders = await apiClient.getUserOrders(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(orders).toEqual([mockOrder]);
      expect(scope.isDone()).toBe(true); // Ensure the mock was called
    });

    it('should handle pagination correctly', async () => {
      const scopePage1 = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserOrders') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            listOrderPackages: {
              items: [mockOrder],
              nextToken: 'next-token-1',
            },
          },
        });

      const scopePage2 = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserOrders') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === 'next-token-1'
          );
        })
        .reply(200, {
          data: {
            listOrderPackages: {
              items: [{ ...mockOrder, id: 'order2' }],
              nextToken: null,
            },
          },
        });

      const orders = await apiClient.getUserOrders(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(orders).toEqual([mockOrder, { ...mockOrder, id: 'order2' }]);
      expect(scopePage1.isDone()).toBe(true);
      expect(scopePage2.isDone()).toBe(true);
    });

    it('should return an empty array when no orders are found', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListUserOrders'))
        .reply(200, {
          data: {
            listOrderPackages: {
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
        .post('', (body) => body.query.includes('ListUserOrders'))
        .reply(500, { errors: [{ message: 'Internal Server Error' }] });

      await expect(
        apiClient.getUserOrders(MOCK_USER_ID, MOCK_ACCESS_TOKEN),
      ).rejects.toThrow('Failed to fetch user orders:'); // Check prefix
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('when fetching user results', () => {
    it('should return user results without pagination', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserResults') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            listResults: {
              items: [mockResult],
              nextToken: null,
            },
          },
        });

      const results = await apiClient.getUserResults(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(results).toEqual([mockResult]);
      expect(scope.isDone()).toBe(true);
    });

    it('should handle pagination correctly for results', async () => {
      const scopePage1 = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserResults') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === null
          );
        })
        .reply(200, {
          data: {
            listResults: {
              items: [mockResult],
              nextToken: 'next-token-res-1',
            },
          },
        });

      const scopePage2 = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListUserResults') &&
            body.variables.userId === MOCK_USER_ID &&
            body.variables.nextToken === 'next-token-res-1'
          );
        })
        .reply(200, {
          data: {
            listResults: {
              items: [{ ...mockResult, id: 'result2' }],
              nextToken: null,
            },
          },
        });

      const results = await apiClient.getUserResults(
        MOCK_USER_ID,
        MOCK_ACCESS_TOKEN,
      );

      expect(results).toEqual([mockResult, { ...mockResult, id: 'result2' }]);
      expect(scopePage1.isDone()).toBe(true);
      expect(scopePage2.isDone()).toBe(true);
    });

    it('should return an empty array when no results are found', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListUserResults'))
        .reply(200, {
          data: {
            listResults: {
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
        .post('', (body) => body.query.includes('ListUserResults'))
        .reply(500, { errors: [{ message: 'Results Error' }] });

      await expect(
        apiClient.getUserResults(MOCK_USER_ID, MOCK_ACCESS_TOKEN),
      ).rejects.toThrow('Failed to fetch user results:');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('when fetching all products', () => {
    it('should return products without pagination', async () => {
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
              items: [mockProduct],
              nextToken: null,
            },
          },
        });

      const products = await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);

      expect(products).toEqual([mockProduct]);
      expect(scope.isDone()).toBe(true);
    });

    it('should handle pagination correctly for products', async () => {
      const scopePage1 = nock(MOCK_API_URL)
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
              items: [mockProduct],
              nextToken: 'next-prod-token',
            },
          },
        });

      const scopePage2 = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => {
          return (
            body.query.includes('ListProducts') &&
            body.variables.nextToken === 'next-prod-token'
          );
        })
        .reply(200, {
          data: {
            listProducts: {
              items: [{ ...mockProduct, id: 'product2' }],
              nextToken: null,
            },
          },
        });

      const products = await apiClient.getAllProducts(MOCK_ACCESS_TOKEN);

      expect(products).toEqual([
        mockProduct,
        { ...mockProduct, id: 'product2' },
      ]);
      expect(scopePage1.isDone()).toBe(true);
      expect(scopePage2.isDone()).toBe(true);
    });

    it('should return an empty array when no products are found', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
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

    // Note: The original getAllProducts doesn't have explicit error handling like the others.
    // We'll test the underlying graphql-request error propagation via nock.
    it('should throw an error if the product API call fails', async () => {
      const scope = nock(MOCK_API_URL)
        .matchHeader('Authorization', `Bearer ${MOCK_ACCESS_TOKEN}`)
        .post('', (body) => body.query.includes('ListProducts'))
        .reply(500, { errors: [{ message: 'Product Error' }] });

      // Expecting the raw error from graphql-request or nock here
      await expect(
        apiClient.getAllProducts(MOCK_ACCESS_TOKEN),
      ).rejects.toThrow(); // More specific error matching might depend on graphql-request version
      expect(scope.isDone()).toBe(true);
    });
  });
});
