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
  ): Promise<UserOrderFragment[]> {
    try {
      const client = this.getClient(accessToken);
      const sdk = getSdk(client);
      const now = Date.now();

      const response = await sdk.GetUserOrdersAndPackages({
        userId,
        nextToken: null,
      });
      const orderByOwner = response.orderByOwner;
      this.logger.debug(
        `[userId: ${userId}] GetUserOrdersAndPackages (single fetch) took ${Date.now() - now}ms, orders fetched: ${orderByOwner?.items?.length ?? 0}`,
      );

      let fetchedPackages: UserOrderFragment[] = [];
      if (orderByOwner?.items) {
        fetchedPackages = orderByOwner.items.flatMap(
          (order) => order?.packages?.items?.filter(Boolean) ?? [],
        ) as UserOrderFragment[];
      }

      if (orderByOwner?.nextToken) {
        this.logger.warn(
          `[userId: ${userId}] GetUserOrdersAndPackages response contained a nextToken (${orderByOwner.nextToken.substring(0, 10)}...), but pagination is disabled. Fetched ${fetchedPackages.length} packages.`,
        );
      }

      return fetchedPackages;
    } catch (error) {
      this.logger.error(
        `[userId: ${userId}] Failed to fetch user orders: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `[userId: ${userId}] Failed to fetch user orders: ${error.message}`,
      );
    }
  }

  async getUserResults(
    userId: string,
    accessToken: string,
  ): Promise<UserResultFragment[]> {
    try {
      const client = this.getClient(accessToken);
      const sdk = getSdk(client);
      const now = Date.now();

      const response = await sdk.ListUserResults({
        userId,
        nextToken: null,
      });

      const resultByOwner = response.resultByOwner;
      this.logger.debug(
        `[userId: ${userId}] ListUserResults (single fetch) took ${Date.now() - now}ms ${resultByOwner?.items.length} rows returned`,
      );

      const currentItems =
        (resultByOwner?.items?.filter(Boolean) as UserResultFragment[]) ?? [];

      if (resultByOwner?.nextToken) {
        this.logger.warn(
          `[userId: ${userId}] ListUserResults response contained a nextToken (${resultByOwner.nextToken.substring(0, 10)}...), but pagination is disabled. Fetched ${currentItems.length} results.`,
        );
      }

      return currentItems;
    } catch (error) {
      this.logger.error(
        `[userId: ${userId}] Failed to fetch user results: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `[userId: ${userId}] Failed to fetch user results: ${error.message}`,
      );
    }
  }

  async getAllProducts(accessToken: string): Promise<ProductFragment[]> {
    const client = this.getClient(accessToken);
    const sdk = getSdk(client);
    const now = Date.now();

    const { listProducts } = await sdk.ListProducts({
      nextToken: null,
    });
    this.logger.debug(
      `ListProducts (single fetch) took ${Date.now() - now}ms ${listProducts?.items.length} rows returned`,
    );

    const currentItems =
      (listProducts?.items?.filter(Boolean) as ProductFragment[]) ?? [];

    if (listProducts?.nextToken) {
      this.logger.warn(
        `ListProducts response contained a nextToken (${listProducts.nextToken.substring(0, 10)}...), but pagination is disabled. Fetched ${currentItems.length} products.`,
      );
    }

    return currentItems;
  }
}
