import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Provider, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppConfigType } from '../config';
import * as schema from './schema';
export const DRIZZLE_INSTANCE = Symbol('DRIZZLE_INSTANCE');

const createDrizzle = (config: ConfigService<AppConfigType>) => {
  return drizzle({
    connection: config.getOrThrow('DATABASE_URL'),
    schema,
  });
};

export const drizzleProvider: Provider = {
  provide: DRIZZLE_INSTANCE,
  scope: Scope.DEFAULT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppConfigType>) => {
    return createDrizzle(config);
  },
};

export type DrizzleInstanceType = ReturnType<typeof createDrizzle>;

export type DbTransactionAdapter =
  TransactionalAdapterDrizzleOrm<DrizzleInstanceType>;
