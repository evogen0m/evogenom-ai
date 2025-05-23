import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModuleOptions } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { DbModule } from 'src/db/db.module';
import { DRIZZLE_INSTANCE } from 'src/db/drizzle.provider';
import { validate } from '../src/config';

export const createTestingModuleWithDb = (
  metadata: ModuleMetadata,
  options?: TestingModuleOptions,
) => {
  metadata.imports = [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: '.env.test',
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

    ...(metadata.imports || []),
  ];
  return Test.createTestingModule(metadata, options);
};
