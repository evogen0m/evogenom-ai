import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { validate } from './config';
import { DbModule } from './db/db.module';
import { DRIZZLE_INSTANCE } from './db/drizzle.provider';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
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
        }),
      ],
    }),
    AuthModule,
    OpenAIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
