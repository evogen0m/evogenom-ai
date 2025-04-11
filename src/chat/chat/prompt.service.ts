import { Injectable } from '@nestjs/common';
import * as R from 'remeda';
import { ContentfulApiClient } from 'src/contentful/contentful-api-client';
import {
  TypeProductFields,
  TypeResultRowFields,
} from 'src/contentful/generated-types';
import { EvogenomApiClient } from 'src/evogenom-api-client/evogenom-api.client';
import { ProductFragment } from 'src/evogenom-api-client/generated/request';

interface ContentfulWrapper<T> {
  values: T;
}

function isContentfulWrapper<T>(
  value: T | ContentfulWrapper<T>,
): value is ContentfulWrapper<T> {
  return typeof value === 'object' && value !== null && 'values' in value;
}

const getContentfulValue = <T>(value: T | ContentfulWrapper<T>): T => {
  if (isContentfulWrapper(value)) {
    return value.values;
  }
  return value;
};

@Injectable()
export class PromptService {
  constructor(
    private readonly evogenomApiClient: EvogenomApiClient,
    private readonly contentfulApiClient: ContentfulApiClient,
  ) {}

  async getSystemPrompt(userId: string, evogenomApiToken: string) {
    const results = await this.evogenomApiClient.getUserResults(
      userId,
      evogenomApiToken,
    );

    const productByProductId = R.pipe(
      await this.evogenomApiClient.getAllProducts(evogenomApiToken),
      R.indexBy((product) => product.id),
    );

    const productCodes = R.pipe(
      results,
      R.filter((result) => result.productResultsId != null),
      R.map((result) => productByProductId[result.productResultsId as string]),
      R.filter(Boolean),
      R.map((product: ProductFragment) => product.productCode),
      R.unique(),
    );

    const resultsByProductCode =
      await this.getResultRowsByProductCode(productCodes);
    const productsByProductCode =
      await this.getProductByProductCode(productCodes);

    return this.formatSystemPrompt(resultsByProductCode, productsByProductCode);
  }

  async getResultRowsByProductCode(productCodes: string[]) {
    const resultRows = await this.contentfulApiClient.getResults(productCodes);

    return R.pipe(
      resultRows.items,
      R.map((resultRow) => resultRow.fields),
      R.indexBy((resultRow) => resultRow.productCode as string),
    ) as Record<string, TypeResultRowFields>;
  }

  async getProductByProductCode(productCodes: string[]) {
    const products = await this.contentfulApiClient.getProducts(productCodes);
    return R.pipe(
      products.items,
      R.map((product) => product.fields),

      R.indexBy((product) =>
        R.isNumber(product.productCode)
          ? product.productCode.toString()
          : product.productCode.values.toString(),
      ),
    ) as Record<string, TypeProductFields>;
  }

  formatSystemPrompt(
    results: Record<string, TypeResultRowFields>,
    products: Record<string, TypeProductFields>,
  ) {
    const formatResult = (productCode: string) => {
      const result = results[productCode];
      const product = products[productCode];
      if (!result || !product) {
        return undefined;
      }

      return `${getContentfulValue(product.name)}: ${getContentfulValue(result.resultText)}`;
    };

    const productResults = Object.keys(results)
      .map(formatResult)
      .filter(Boolean)
      .map((result) => `  - ${result}`)
      .join('\n');

    return `
# Your Role & Purpose
You are an AI Wellness Coach. Your role is to:
- Act as a smart, supportive companion for the user
- Guide users through everyday wellbeing choices including recovery, rest, energy management, and self-leadership
- Provide timely, personalized nudges based on the user's patterns, behavior, and needs
- Reflect the user's lifestyle and recognize their habits
- Communicate like a mentor who genuinely cares about the user's wellbeing
- Be consistent, compassionate, and constructive in all interactions

Remember that you are not just a chatbot - you are a coach who knows the user personally and is invested in their wellness journey.

You are employed at Evogenom, a DNA genotyping company. Evogenom sells DNA tests to customers and provides insights into their DNA, specifically how their DNA affects their health and wellbeing.

# User's genotyping results
${productResults}
  `;
  }
}
