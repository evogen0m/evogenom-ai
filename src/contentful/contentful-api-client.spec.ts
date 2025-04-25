import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentfulApiClient } from './contentful-api-client';
import { getSdk } from './generated/types';

// Mock the graphql-request client
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

// Mock the getSdk function
vi.mock('./generated/types', () => {
  return {
    getSdk: vi.fn().mockReturnValue({
      GetResults: vi.fn().mockResolvedValue({
        resultRowCollection: {
          items: [
            {
              productCode: '101',
              resultText: 'Mock Result Text 1',
              sys: { id: 'result-id-1' },
            },
            {
              productCode: '102',
              resultText: 'Mock Result Text 2',
              sys: { id: 'result-id-2' },
            },
          ],
        },
      }),
      GetProducts: vi.fn().mockResolvedValue({
        productCollection: {
          items: [
            {
              productCode: 101,
              name: 'Mock Product 1',
              sys: { id: 'product-id-1' },
            },
            {
              productCode: 102,
              name: 'Mock Product 2',
              sys: { id: 'product-id-2' },
            },
          ],
        },
      }),
    }),
  };
});

describe('ContentfulApiClient', () => {
  let service: ContentfulApiClient;
  let mockConfigService: ConfigService;
  let mockGetSdk: any;

  beforeEach(() => {
    // Create a mock config service
    mockConfigService = {
      getOrThrow: vi.fn((key) => {
        if (key === 'CONTENTFUL_ACCESS_TOKEN') return 'fake-token';
        if (key === 'CONTENTFUL_SPACE_ID') return 'fake-space-id';
        return undefined;
      }),
    } as unknown as ConfigService;

    // Reset mocks between tests
    vi.clearAllMocks();

    mockGetSdk = getSdk as any;

    // Create the service
    service = new ContentfulApiClient(mockConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create GraphQL client with correct params', () => {
    service.getClient();

    expect(GraphQLClient).toHaveBeenCalledWith(
      'https://graphql.contentful.com/content/v1/spaces/fake-space-id',
      {
        headers: {
          Authorization: 'Bearer fake-token',
        },
      },
    );
  });

  it('should call GetResults with correct variables when getting results', async () => {
    const productCodes = ['101', '102'];
    const results = await service.getResults(productCodes);

    // Verify getSdk was called with the GraphQL client
    expect(mockGetSdk).toHaveBeenCalled();

    // Get the SDK instance that was returned by getSdk
    const sdkInstance = mockGetSdk.mock.results[0].value;

    // Verify GetResults was called with the correct variables
    expect(sdkInstance.GetResults).toHaveBeenCalledWith({
      productCodes,
      limit: 1000,
      locale: 'en-US',
    });

    // Verify the results were returned correctly
    expect(results).toHaveLength(2);
    expect(results[0].productCode).toBe('101');
    expect(results[1].productCode).toBe('102');
  });

  it('should call GetProducts with correct variables when getting products', async () => {
    const productCodes = ['101', '102'];
    const products = await service.getProducts(productCodes);

    // Verify getSdk was called with the GraphQL client
    expect(mockGetSdk).toHaveBeenCalled();

    // Get the SDK instance that was returned by getSdk
    const sdkInstance = mockGetSdk.mock.results[0].value;

    // Verify GetProducts was called with correct variables
    expect(sdkInstance.GetProducts).toHaveBeenCalledWith({
      productCodes: [101, 102],
      limit: 1000,
      locale: 'en-US',
    });

    // Verify the products were returned correctly
    expect(products).toHaveLength(2);
    expect(products[0].productCode).toBe(101);
    expect(products[1].productCode).toBe(102);
  });

  it('should throw an error when GetResults query fails', async () => {
    // Mock the SDK to throw an error
    mockGetSdk.mockReturnValueOnce({
      GetResults: vi.fn().mockRejectedValueOnce(new Error('API error')),
      GetProducts: vi.fn(),
    });

    const productCodes = ['101', '102'];

    await expect(service.getResults(productCodes)).rejects.toThrow(
      'Failed to fetch results: API error',
    );
  });

  it('should throw an error when GetProducts query fails', async () => {
    // Mock the SDK to throw an error
    mockGetSdk.mockReturnValueOnce({
      GetResults: vi.fn(),
      GetProducts: vi.fn().mockRejectedValueOnce(new Error('API error')),
    });

    const productCodes = ['101', '102'];

    await expect(service.getProducts(productCodes)).rejects.toThrow(
      'Failed to fetch products: API error',
    );
  });
});
