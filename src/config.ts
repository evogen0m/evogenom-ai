import { z } from 'zod';

export const EnvConfigSchema = z.object({
  // Application Settings
  DEBUG: z.preprocess((val) => val === 'true' || val === true, z.boolean()),

  // Server Settings
  HOST: z.string().min(1),
  PORT: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().positive(),
  ),

  // Database Settings
  DATABASE_URL: z.string().min(1),

  // OpenID Configuration
  OPENID_CONFIG_URL: z.string().url(),

  // Azure OpenAI Settings
  AZURE_OPENAI_API_KEY: z.string().min(1),
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_API_VERSION: z.string().min(1),
  AZURE_OPENAI_DEPLOYMENT: z.string().min(1).default('gpt-4.1'),
  AZURE_OPENAI_DEPLOYMENT_MINI: z.string().min(1).default('gpt-4.1-mini'),
  AZURE_OPENAI_MODEL: z.string().min(1).default('gpt-4.1'),
  AZURE_OPENAI_MODEL_MINI: z.string().min(1).default('gpt-4.1-mini'),
  AZURE_OPENAI_EMBEDDING_MODEL: z
    .string()
    .min(1)
    .default('text-embedding-3-small'),

  DATABASE_USE_SSL: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default('false'),

  EVOGENOM_API_URL: z.string().url(),
  CONTENTFUL_ACCESS_TOKEN: z.string().min(1),
  CONTENTFUL_SPACE_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT: z
    .string()
    .min(1)
    .startsWith('{', 'Value should be a valid JSON object'),
  SAMPLE_EVENTS_SQS_URL: z.string().url().optional(),
  ORDER_EVENTS_SQS_URL: z.string().url().optional(),
  COGNITO_USER_POOL_ID: z.string().min(1),
  AWS_REGION: z.string().min(1),
});

export type AppConfigType = z.infer<typeof EnvConfigSchema>;

export const validate = (config: Record<string, unknown>) => {
  const result = EnvConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error(result.error.toString());
  }

  return result.data;
};
