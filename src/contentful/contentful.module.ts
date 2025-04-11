import { Module } from '@nestjs/common';
import { ContentfulApiClient } from './contentful-api-client';

@Module({
  providers: [ContentfulApiClient],
  exports: [ContentfulApiClient],
})
export class ContentfulModule {}
