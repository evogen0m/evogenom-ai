import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

import {
  getSdk,
  ProductFragment,
  UserOrderFragment,
  UserResultFragment,
} from './generated/request';

@Injectable()
export class EvogenomApiClient {
  constructor(private readonly configService: ConfigService) {}

  logger = new Logger(EvogenomApiClient.name);

  getClient(accessToken: string): GraphQLClient {
    return new GraphQLClient(this.getApiUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  getApiUrl() {
    return this.configService.getOrThrow('EVOGENOM_API_URL');
  }

  async getUserOrders(
    userId: string,
    accessToken: string,
    nextToken?: string,
  ): Promise<UserOrderFragment[]> {
    try {
      const client = this.getClient(accessToken);
      const sdk = getSdk(client);
      const now = Date.now();
      const { listOrderPackages } = await sdk.ListUserOrders({
        userId,
        nextToken: nextToken || null,
      });
      this.logger.debug(
        `ListUserOrders took ${Date.now() - now}ms ${listOrderPackages?.items.length} rows returned`,
      );
      if (listOrderPackages?.nextToken && listOrderPackages?.items.length > 0) {
        return [
          ...(listOrderPackages?.items.filter(Boolean) ?? []),
          ...(await this.getUserOrders(
            userId,
            accessToken,
            listOrderPackages.nextToken,
          )),
        ] as UserOrderFragment[];
      }

      return (
        (listOrderPackages?.items?.filter(Boolean) as UserOrderFragment[]) ?? []
      );
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }

  async getUserResults(
    userId: string,
    accessToken: string,
    nextToken?: string,
  ): Promise<UserResultFragment[]> {
    try {
      const client = this.getClient(accessToken);
      const sdk = getSdk(client);
      const now = Date.now();
      const { listResults } = await sdk.ListUserResults({
        userId,
        nextToken: nextToken || null,
      });
      this.logger.debug(
        `ListUserResults took ${Date.now() - now}ms ${listResults?.items.length} rows returned`,
      );
      if (listResults?.nextToken && listResults?.items.length > 0) {
        return [
          ...(listResults?.items ?? []),
          ...(await this.getUserResults(
            userId,
            accessToken,
            listResults.nextToken,
          )),
        ] as UserResultFragment[];
      }

      return (listResults?.items as UserResultFragment[]) ?? [];
    } catch (error) {
      throw new Error(`Failed to fetch user results: ${error.message}`);
    }
  }

  async getAllProducts(
    accessToken: string,
    nextToken?: string,
  ): Promise<ProductFragment[]> {
    const client = this.getClient(accessToken);
    const sdk = getSdk(client);
    const now = Date.now();
    const { listProducts } = await sdk.ListProducts({
      nextToken: nextToken || null,
    });
    this.logger.debug(
      `ListProducts took ${Date.now() - now}ms ${listProducts?.items.length} rows returned`,
    );

    if (listProducts?.nextToken && listProducts?.items.length > 0) {
      return [
        ...(listProducts?.items.filter(Boolean) as ProductFragment[]),
        ...(await this.getAllProducts(accessToken, listProducts.nextToken)),
      ];
    }

    return (listProducts?.items as ProductFragment[]) ?? [];
  }
}
