import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  generates: {
    'src/evogenom-api-client/generated/request.ts': {
      schema: './graphql/schema.graphql',
      documents: 'src/evogenom-api-client/**/*.ts',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        avoidOptionals: true,
      },
    },
    'src/contentful/generated/types.ts': {
      schema: {
        'https://graphql.contentful.com/content/v1/spaces/nslj8lsfnbof': {
          headers: {
            Authorization: 'Bearer _cWAWRuTJrTFSyrJ6aaIPGdFXWKXKG58F4Pmi9ymzQU',
          },
        },
      },
      documents: 'src/contentful/**/*.ts',
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
