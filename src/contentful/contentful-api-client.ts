import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as contentful from 'contentful';
import { AppConfigType } from 'src/config';
import {
  TypeProductSkeleton,
  TypeResultRowSkeleton,
} from 'src/contentful/generated-types';

@Injectable()
export class ContentfulApiClient {
  client: ReturnType<typeof contentful.createClient>;

  constructor(private readonly configService: ConfigService<AppConfigType>) {
    this.client = contentful.createClient({
      accessToken: this.configService.getOrThrow('CONTENTFUL_ACCESS_TOKEN'),
      space: this.configService.getOrThrow('CONTENTFUL_SPACE_ID'),
    });
  }

  getResults(productCodes: string[]) {
    return this.client.getEntries<TypeResultRowSkeleton, 'en-US'>({
      content_type: 'resultRow',
      limit: 1000,
      locale: 'en-US',
      'fields.productCode[in]': productCodes,
    });
  }

  getProducts(productCodes: string[]) {
    return this.client.getEntries<TypeProductSkeleton, 'en-US'>({
      content_type: 'product',
      limit: 1000,
      locale: 'en-US',
      'fields.productCode[in]': productCodes.map((code) => parseInt(code, 10)),
    });
  }
}
