import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { validate } from './config';
import { ContentfulApiClient } from './contentful/contentful-api-client';
import { ContentfulModule } from './contentful/contentful.module';
import { DbModule } from './db/db.module';
import { DRIZZLE_INSTANCE } from './db/drizzle.provider';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ChatModule,
    DbModule,
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: [process.env.NODE_ENV === 'test' ? '.env.test' : '.env'],
    }),
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          imports: [DbModule],
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: DRIZZLE_INSTANCE,
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
    AuthModule,
    OpenAIModule,
    ContentfulModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    ContentfulApiClient,
  ],
})
export class AppModule {}
