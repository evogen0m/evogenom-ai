import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';
import { AppConfigType } from 'src/config';
import {
  GetProductsQueryVariables,
  GetResultsQueryVariables,
  getSdk,
  ProductFieldsFragment,
  ResultRowFieldsFragment,
} from './generated/types';

@Injectable()
export class ContentfulApiClient {
  constructor(private readonly configService: ConfigService<AppConfigType>) {}

  logger = new Logger(ContentfulApiClient.name);

  getClient(): GraphQLClient {
    const spaceId = this.configService.getOrThrow('CONTENTFUL_SPACE_ID');
    const accessToken = this.configService.getOrThrow(
      'CONTENTFUL_ACCESS_TOKEN',
    );

    return new GraphQLClient(
      `https://graphql.contentful.com/content/v1/spaces/${spaceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async getResults(productCodes: string[]): Promise<ResultRowFieldsFragment[]> {
    try {
      const client = this.getClient();
      const sdk = getSdk(client);
      const variables: GetResultsQueryVariables = {
        productCodes,
        limit: 1000,
        locale: 'en-US',
      };

      const now = Date.now();
      const result = await sdk.GetResults(variables);
      this.logger.debug(`GetResults took ${Date.now() - now}ms`);
      return (
        (result.resultRowCollection?.items?.filter(
          Boolean,
        ) as ResultRowFieldsFragment[]) ?? []
      );
    } catch (error) {
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  async getProducts(productCodes: string[]): Promise<ProductFieldsFragment[]> {
    try {
      const client = this.getClient();
      const sdk = getSdk(client);
      const variables: GetProductsQueryVariables = {
        productCodes: productCodes.map((code) => parseInt(code, 10)),
        limit: 1000,
        locale: 'en-US',
      };

      const now = Date.now();
      const result = await sdk.GetProducts(variables);
      this.logger.debug(`GetProducts took ${Date.now() - now}ms`);
      return (
        (result.productCollection?.items?.filter(
          Boolean,
        ) as ProductFieldsFragment[]) ?? []
      );
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }
}
