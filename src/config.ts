import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

export class EnvConfig {
  // Application Settings
  @IsBoolean()
  DEBUG: boolean;

  // Server Settings
  @IsString()
  @IsNotEmpty()
  HOST: string;

  @IsNumber()
  PORT: number;

  // Database Settings
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // OpenID Configuration
  @IsUrl()
  @IsNotEmpty()
  OPENID_CONFIG_URL: string;

  // Azure OpenAI Settings
  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_API_KEY: string;

  @IsUrl()
  @IsNotEmpty()
  AZURE_OPENAI_ENDPOINT: string;

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_API_VERSION: string;

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_DEPLOYMENT: string;

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_DEPLOYMENT_MINI: string;

  @IsString()
  @IsNotEmpty()
  AZURE_OPENAI_MODEL: string;
}

export type AppConfigType = InstanceType<typeof EnvConfig>;

export const validate = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvConfig, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
