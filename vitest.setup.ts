// Load environment variables from .env.test file
import { config } from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata'; // Import reflect-metadata for NestJS decorators
import { afterAll, beforeAll, vi } from 'vitest';

// Load environment variables from .env.test

// Any global mock setup can be done here

// Setup and teardown hooks for all tests
beforeAll(() => {
  config({ path: resolve(__dirname, '.env.test') });
  // Any setup logic before all tests
});

afterAll(() => {
  // Any cleanup logic after all tests
  vi.restoreAllMocks();
});
