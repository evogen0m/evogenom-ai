import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './graphql/schema.graphql',
  documents: 'src/evogenom-api-client/**/*.ts',
  generates: {
    'src/evogenom-api-client/generated/request.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        avoidOptionals: true,
      },
    },
  },
};

export default config;
