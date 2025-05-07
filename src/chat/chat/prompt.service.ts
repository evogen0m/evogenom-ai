import { Injectable } from '@nestjs/common';
import * as dateFnsTz from 'date-fns-tz';
import * as R from 'remeda';
import { ContentfulApiClient } from 'src/contentful/contentful-api-client';
import {
  ProductFieldsFragment,
  ResultRowFieldsFragment,
} from 'src/contentful/generated/types';
import { EvogenomApiClient } from 'src/evogenom-api-client/evogenom-api.client';
import { ProductFragment } from 'src/evogenom-api-client/generated/request';

// Add ChatContextMetadata interface
export interface ChatContextMetadata {
  currentMessageCount: number;
  totalHistoryCount: number;
  userTimeZone: string;
  scheduledFollowups: {
    id: string;
    // Formatted to user's local time
    dueDate: string;
    content: string;
  }[];
}

const toneAndFeel = `
	•	Supportive & Encouraging: Maintain a warm, uplifting, and affirming approach, consistently acknowledging the user's efforts and strengths.
	•	Empathetic & Personal: Communicate in a way that shows genuine care and understanding, demonstrating awareness of the user's unique patterns and challenges.
	•	Informative & Insightful: Provide clear explanations about the user's behaviors or test results, helping them understand how their choices affect their body and well-being.
	•	Actionable & Practical: Always suggest specific, manageable strategies and tips that the user can realistically integrate into their daily life.
	•	Balanced & Nuanced: Gently address the user's patterns without judgment or criticism, framing improvements positively as opportunities rather than shortcomings.
	•	Empowering & Motivational: Consistently highlight the benefits of self-care and recovery, reinforcing that these practices enhance overall performance and strength, not diminish drive.
	•	Gentle & Friendly: Keep communication casual, conversational, and approachable, incorporating appropriate warmth (e.g., emojis, gentle humor) to foster a sense of comfort and connection.
	•	Mindful & Holistic: Consider both physical and emotional dimensions of health, guiding the user toward mindful practices that support overall balance and well-being.`;

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

  async getSystemPrompt(
    userId: string,
    evogenomApiToken: string,
    contextMetadata: ChatContextMetadata,
  ) {
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

    return this.formatSystemPrompt(
      resultsByProductCode,
      productsByProductCode,
      contextMetadata,
    );
  }

  async getResultRowsByProductCode(productCodes: string[]) {
    const resultRowsCollection =
      await this.contentfulApiClient.getResults(productCodes);

    return R.pipe(
      resultRowsCollection,
      R.filter(
        (resultRow): resultRow is NonNullable<ResultRowFieldsFragment> =>
          resultRow?.productCode != null,
      ),
      R.map((resultRow) => ({
        productCode: resultRow.productCode,
        resultText: resultRow.resultText,
        // Add other properties as needed
      })),
      R.indexBy((resultRow) => (resultRow.productCode as string) || ''),
    ) as Record<string, ResultRowFieldsFragment>;
  }

  async getProductByProductCode(productCodes: string[]) {
    const products = await this.contentfulApiClient.getProducts(productCodes);

    // Create an empty array of products if productsCollection is null

    return R.pipe(
      products,
      R.filter(
        (product): product is NonNullable<ProductFieldsFragment> =>
          product !== null,
      ),

      R.indexBy((product) => product.productCode?.toString() || ''),
    ) as Record<string, ProductFieldsFragment>;
  }

  formatSystemPrompt(
    results: Record<string, ResultRowFieldsFragment>,
    products: Record<string, ProductFieldsFragment>,
    contextMetadata: ChatContextMetadata,
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

    // Format pending followups
    const followupsInfo =
      contextMetadata?.scheduledFollowups &&
      contextMetadata.scheduledFollowups.length > 0
        ? `
# Scheduled Follow-ups
${contextMetadata.scheduledFollowups
  .map(
    (followup) =>
      `- Follow-up ID: ${followup.id}, Due: ${new Date(followup.dueDate).toLocaleString()} Content: ${followup.content}`,
  )
  .join('\n')}
`
        : '';

    const chatContextInfo = contextMetadata
      ? `
# Chat Context Information
- Current conversation: ${contextMetadata.currentMessageCount} messages
- Total history: ${contextMetadata.totalHistoryCount} messages
${
  contextMetadata.totalHistoryCount > contextMetadata.currentMessageCount
    ? '- Note: There are previous conversations not included in this context. Use the memory tool to search this history if needed.'
    : ''
}
${followupsInfo}
`
      : '';

    return `
# Current date and time: ${dateFnsTz.formatInTimeZone(new Date(), contextMetadata.userTimeZone, 'yyyy-MM-dd HH:mm')}
# Your Role & Purpose
You are an AI Wellness Coach. Your role is to:
- Act as a smart, supportive companion for the user
- Guide users through everyday wellbeing choices including recovery, rest, energy management, and self-leadership
- Provide timely, personalized nudges based on the user's patterns, behavior, and needs
- Reflect the user's lifestyle and recognize their habits
- Communicate like a mentor who genuinely cares about the user's wellbeing
- Be consistent, compassionate, and constructive in all interactions
- Instead of giving long answers, give short and concise answers and ask follow up questions if needed, remember that you are typing to a mobile chat app, reading long text is not practical for the user.

- You may use ONLY the following markdown tags: bold, italic, underline, bullet points

Remember that you are not just a chatbot - you are a coach who knows the user personally and is invested in their wellness journey.

You are employed at Evogenom, a DNA genotyping company. Evogenom sells DNA tests to customers and provides insights into their DNA, specifically how their DNA affects their health and wellbeing.
${chatContextInfo}
# User's genotyping results
${productResults}

# Take on the following tone and feel in your responses:
${toneAndFeel}

  `;
  }
}
