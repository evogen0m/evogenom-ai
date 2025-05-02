import { describe, expect, it } from 'vitest';
import { validate } from './config';

describe('when validating environment configuration', () => {
  it('should throw an error when given invalid config', () => {
    // Arrange
    const invalidConfig = {};

    // Act & Assert
    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should return the validated config when valid', () => {
    // Arrange
    const validConfig = {
      DEBUG: true,
      HOST: 'localhost',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      OPENID_CONFIG_URL: 'https://example.com/openid',
      AZURE_OPENAI_API_KEY: 'key123',
      AZURE_OPENAI_ENDPOINT: 'https://example.com/openai',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      AZURE_OPENAI_DEPLOYMENT: 'deployment-name',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'mini-deployment',
      AZURE_OPENAI_MODEL: 'model-name',
      EVOGENOM_API_URL: 'https://api.example.com',
      CONTENTFUL_ACCESS_TOKEN: 'token',
      CONTENTFUL_SPACE_ID: 'space',
      FIREBASE_SERVICE_ACCOUNT: '{"project_id": "test-project-id"}',
    };

    // Act
    const result = validate(validConfig);

    // Assert
    // Zod schema adds defaults like DATABASE_USE_SSL, so we need to check if the values we expect are in the result
    expect(result).toMatchObject(validConfig);
  });

  it('should throw an error when field has invalid type', () => {
    // Arrange
    const invalidTypeConfig = {
      DEBUG: 'not-a-boolean', // Should be boolean but zod preprocessor converts it
      HOST: 'localhost',
      PORT: 'not-a-number', // This should fail type validation
      DATABASE_URL: 'https://example.com/db',
      OPENID_CONFIG_URL: 'https://example.com/openid',
      AZURE_OPENAI_API_KEY: '12345',
      AZURE_OPENAI_ENDPOINT: 'https://example.com/openai',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      AZURE_OPENAI_DEPLOYMENT: 'deployment-name',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'mini-deployment',
      AZURE_OPENAI_MODEL: 'model-name',
      EVOGENOM_API_URL: 'https://api.example.com',
      CONTENTFUL_ACCESS_TOKEN: 'token',
      CONTENTFUL_SPACE_ID: 'space',
    };

    // Act & Assert
    expect(() => validate(invalidTypeConfig)).toThrow(/PORT/); // Zod will include the field name in the error
  });

  it('should throw an error when required URL is not valid', () => {
    // Arrange
    const invalidUrlConfig = {
      DEBUG: true,
      HOST: 'localhost',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      OPENID_CONFIG_URL: 'not-a-valid-url', // Should be a valid URL format
      AZURE_OPENAI_API_KEY: '12345',
      AZURE_OPENAI_ENDPOINT: 'https://example.com/openai',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      AZURE_OPENAI_DEPLOYMENT: 'deployment-name',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'mini-deployment',
      AZURE_OPENAI_MODEL: 'model-name',
      EVOGENOM_API_URL: 'https://api.example.com',
      CONTENTFUL_ACCESS_TOKEN: 'token',
      CONTENTFUL_SPACE_ID: 'space',
    };

    // Act & Assert
    expect(() => validate(invalidUrlConfig)).toThrow(/OPENID_CONFIG_URL/); // Zod will include the field name in the error
  });
});
