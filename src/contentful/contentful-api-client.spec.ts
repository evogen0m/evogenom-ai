/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import * as contentful from 'contentful';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentfulApiClient } from './contentful-api-client';

// Mock the contentful client
vi.mock('contentful', () => ({
  createClient: vi.fn().mockReturnValue({
    getEntries: vi.fn().mockResolvedValue({
      items: [],
    }),
  }),
}));

describe('ContentfulApiClient', () => {
  let provider: ContentfulApiClient;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    // Create a mock config service
    mockConfigService = {
      getOrThrow: vi.fn((key) => {
        if (key === 'CONTENTFUL_ACCESS_TOKEN') return 'fake-token';
        if (key === 'CONTENTFUL_SPACE_ID') return 'fake-space-id';
        return undefined;
      }),
    } as unknown as ConfigService;

    // Create the provider manually
    provider = new ContentfulApiClient(mockConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should create contentful client with correct params', () => {
    expect(contentful.createClient).toHaveBeenCalledWith({
      accessToken: 'fake-token',
      space: 'fake-space-id',
    });
  });

  it('should call getEntries with correct params when getting results', async () => {
    const mockContentfulClient = contentful.createClient({
      accessToken: 'fake-token',
      space: 'fake-space-id',
    });

    const productCodes = ['123', '456'];
    await provider.getResults(productCodes);

    expect(mockContentfulClient.getEntries).toHaveBeenCalledWith({
      content_type: 'resultRow',
      limit: 1000,
      locale: 'en-US',
      'fields.productCode[in]': productCodes,
    });
  });

  it('should call getEntries with correct params when getting products', async () => {
    const mockContentfulClient = contentful.createClient({
      accessToken: 'fake-token',
      space: 'fake-space-id',
    });

    const productCodes = ['123', '456'];
    await provider.getProducts(productCodes);

    expect(mockContentfulClient.getEntries).toHaveBeenCalledWith({
      content_type: 'product',
      limit: 1000,
      locale: 'en-US',
      'fields.productCode[in]': [123, 456],
    });
  });
});
