import { Module } from '@nestjs/common';
import { EvogenomApiClient } from './evogenom-api.client';
@Module({
  imports: [],
  providers: [EvogenomApiClient],
  exports: [EvogenomApiClient],
})
export class EvogenomApiClientModule {}
