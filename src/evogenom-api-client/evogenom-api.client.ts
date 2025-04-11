import { Injectable } from '@nestjs/common';
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
      const { listOrderPackages } = await sdk.ListUserOrders({
        userId,
        nextToken: nextToken || null,
      });

      if (listOrderPackages?.nextToken) {
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
      const { listResults } = await sdk.ListUserResults({
        userId,
        nextToken: nextToken || null,
      });

      if (listResults?.nextToken) {
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
    const { listProducts } = await sdk.ListProducts({
      nextToken: nextToken || null,
    });

    if (listProducts?.nextToken) {
      return [
        ...(listProducts?.items.filter(Boolean) as ProductFragment[]),
        ...(await this.getAllProducts(accessToken, listProducts.nextToken)),
      ];
    }
    return (listProducts?.items as ProductFragment[]) ?? [];
  }
}
