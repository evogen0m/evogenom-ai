import { resolve } from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    root: './',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['cobertura', 'text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', 'src/**/*generated*'],
    },
    alias: {
      src: resolve(__dirname, './src'),
      test: resolve(__dirname, './test'),
    },
    environmentOptions: {
      envFile: '.env.test',
    },
  },
  plugins: [
    // Ensure SWC plugin is used for Vitest tests
    swc.vite(),
  ],
});
