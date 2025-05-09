import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import * as R from 'remeda';
import { ContentfulApiClient } from 'src/contentful/contentful-api-client';
import {
  ProductFieldsFragment,
  ResultRowFieldsFragment,
} from 'src/contentful/generated/types';
import { EvogenomApiClient } from 'src/evogenom-api-client/evogenom-api.client';
import {
  UserResultFragment as EvogenomUserResult,
  ProductFragment,
} from 'src/evogenom-api-client/generated/request';

// Interface for the data structure previously defined in PromptService
interface UserProductResultWithValue {
  productCode: string;
  productName: string; // from Evogenom Product
  userValue: number;
  evogenomProductId: string;
}

export interface MappedUserResult {
  finalProductName: string;
  interpretationText: string;
}

@Injectable()
export class ResultService {
  constructor(
    private readonly evogenomApiClient: EvogenomApiClient,
    private readonly contentfulApiClient: ContentfulApiClient,
  ) {}

  async getResultRowsByProductCode(
    productCodes: string[],
  ): Promise<Record<string, Record<number, ResultRowFieldsFragment>>> {
    if (productCodes.length === 0) return {};
    const resultRowsCollection =
      await this.contentfulApiClient.getResults(productCodes);

    return R.pipe(
      resultRowsCollection,
      R.filter(
        (resultRow): resultRow is NonNullable<ResultRowFieldsFragment> =>
          resultRow?.productCode != null &&
          resultRow.result !== null &&
          resultRow.result !== undefined,
      ),
      R.groupBy((resultRow) => resultRow.productCode!),
      R.mapValues((groupedByProductCode) =>
        R.pipe(
          groupedByProductCode,
          R.indexBy((rr) => rr.result!),
        ),
      ),
    );
  }

  async getProductByProductCode(
    productCodes: string[],
  ): Promise<Record<string, ProductFieldsFragment>> {
    if (productCodes.length === 0) return {};
    const products = await this.contentfulApiClient.getProducts(productCodes);

    return R.pipe(
      products,
      R.filter(
        (product): product is NonNullable<ProductFieldsFragment> =>
          product?.productCode !== null && product?.productCode !== undefined,
      ),
      R.indexBy((product) => String(product.productCode!)),
    ) as Record<string, ProductFieldsFragment>;
  }

  async getMappedUserResults(
    userId: string,
    evogenomApiToken: string,
  ): Promise<MappedUserResult[]> {
    const [evogenomUserResultsData, evogenomAllProductsResponse] =
      await Promise.all([
        this.evogenomApiClient.getUserResults(userId, evogenomApiToken),
        this.evogenomApiClient.getAllProducts(evogenomApiToken),
      ]);

    const evogenomProductById = R.pipe(
      evogenomAllProductsResponse,
      R.filter((p): p is ProductFragment => p?.id != null),
      R.indexBy((product) => product.id),
    );

    const userProductResultsWithValue: UserProductResultWithValue[] = R.pipe(
      evogenomUserResultsData,
      R.map((evogenomResult: EvogenomUserResult) => {
        if (
          !evogenomResult.productResultsId ||
          evogenomResult.value === null ||
          evogenomResult.value === undefined
        )
          return null;
        const evogenomProduct =
          evogenomProductById[evogenomResult.productResultsId];
        if (
          !evogenomProduct ||
          evogenomProduct.productCode === null ||
          evogenomProduct.productCode === undefined
        )
          return null;
        return {
          productCode: String(evogenomProduct.productCode),
          productName: evogenomProduct.name || 'Unknown Product',
          userValue: evogenomResult.value,
          evogenomProductId: evogenomResult.productResultsId,
        };
      }),
      R.filter((r): r is UserProductResultWithValue => r !== null),
    );

    if (userProductResultsWithValue.length === 0) {
      return [];
    }

    const uniqueStringProductCodes = R.pipe(
      userProductResultsWithValue,
      R.map((r) => r.productCode),
      R.unique(),
    );

    const [contentfulResultRowsMap, contentfulProductMap] = await Promise.all([
      this.getResultRowsByProductCode(uniqueStringProductCodes),
      this.getProductByProductCode(uniqueStringProductCodes),
    ]);

    return R.pipe(
      userProductResultsWithValue,
      R.map((userResult) => {
        const productCodeStr = userResult.productCode;
        const userValue = userResult.userValue;
        const evogenomProductName = userResult.productName;

        const contentfulProduct = contentfulProductMap[productCodeStr];
        if (!contentfulProduct) {
          Sentry.captureMessage(
            `Contentful product missing for productCode: ${productCodeStr} (Evogenom product name: ${evogenomProductName})`,
            {
              level: 'warning',
              extra: { productCode: productCodeStr, evogenomProductName },
            },
          );
          return null;
        }

        const relevantContentfulResultRow =
          contentfulResultRowsMap[productCodeStr]?.[userValue];
        if (!relevantContentfulResultRow) {
          Sentry.captureMessage(
            `Contentful result row missing for productCode: ${productCodeStr}, userValue: ${userValue} (Evogenom product name: ${evogenomProductName}, Contentful product name: ${contentfulProduct.name || 'N/A'})`,
            {
              level: 'warning',
              extra: {
                productCode: productCodeStr,
                userValue,
                evogenomProductName,
                contentfulProductName: contentfulProduct.name || 'N/A',
              },
            },
          );
          return null;
        }

        const productName = contentfulProduct.name;
        if (!productName) {
          Sentry.captureMessage(
            `Contentful product name missing for productCode: ${productCodeStr} (Evogenom product name: ${evogenomProductName}). User value: ${userValue}. Result row text: ${relevantContentfulResultRow.resultText || 'N/A'}`,
            {
              level: 'warning',
              extra: {
                productCode: productCodeStr,
                userValue,
                evogenomProductName,
                resultRowTextAvailable:
                  !!relevantContentfulResultRow.resultText,
              },
            },
          );
          return null;
        }

        const resultText = relevantContentfulResultRow.resultText;
        if (!resultText) {
          Sentry.captureMessage(
            `Contentful result text missing for productCode: ${productCodeStr}, userValue: ${userValue} (Contentful product name: ${productName}, Evogenom product name: ${evogenomProductName})`,
            {
              level: 'warning',
              extra: {
                productCode: productCodeStr,
                userValue,
                contentfulProductName: productName,
                evogenomProductName,
              },
            },
          );
          return null;
        }

        return {
          finalProductName: productName,
          interpretationText: resultText,
        };
      }),
      R.filter((item): item is MappedUserResult => item !== null),
    );
  }
}
