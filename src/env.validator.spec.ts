import { validate } from './env.validator';

describe('when validating environment configuration', () => {
  it('should throw an error when given invalid config', () => {
    // Arrange
    const invalidConfig = {
      // Missing several required fields
      DEBUG: true,
      HOST: 'localhost',
      PORT: 3000,
      // Missing DATABASE_URL, OPENID_CONFIG_URL, and all AZURE_OPENAI settings
    };

    // Act & Assert
    expect(() => validate(invalidConfig)).toThrow();
  });

  it('should throw an error when field has invalid type', () => {
    // Arrange
    const invalidTypeConfig = {
      DEBUG: 'not-a-boolean', // Should be boolean
      HOST: 'localhost',
      PORT: 3000,
      DATABASE_URL: 'https://example.com/db',
      OPENID_CONFIG_URL: 'https://example.com/openid',
      AZURE_OPENAI_API_KEY: '12345',
      AZURE_OPENAI_ENDPOINT: 'https://example.com/openai',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      AZURE_OPENAI_DEPLOYMENT: 'deployment-name',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'mini-deployment',
      AZURE_OPENAI_MODEL: 'model-name',
    };

    // Act & Assert
    expect(() => validate(invalidTypeConfig)).toThrow();
  });

  it('should throw an error when required URL is not valid', () => {
    // Arrange
    const invalidUrlConfig = {
      DEBUG: true,
      HOST: 'localhost',
      PORT: 3000,
      DATABASE_URL: 'not-a-valid-url', // Should be a valid URL
      OPENID_CONFIG_URL: 'https://example.com/openid',
      AZURE_OPENAI_API_KEY: '12345',
      AZURE_OPENAI_ENDPOINT: 'https://example.com/openai',
      AZURE_OPENAI_API_VERSION: '2023-05-15',
      AZURE_OPENAI_DEPLOYMENT: 'deployment-name',
      AZURE_OPENAI_DEPLOYMENT_MINI: 'mini-deployment',
      AZURE_OPENAI_MODEL: 'model-name',
    };

    // Act & Assert
    expect(() => validate(invalidUrlConfig)).toThrow();
  });
});
