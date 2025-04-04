import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

config({
  override: true,
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(__dirname, '.env.test')
      : path.resolve(__dirname, '.env'),
});

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
