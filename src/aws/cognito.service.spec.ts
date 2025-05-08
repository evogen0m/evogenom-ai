import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mockClient as awsMockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CognitoService } from './cognito.service';

// Store the real mockClient before mocking the module
const actualMockClient = awsMockClient;

vi.mock('aws-sdk-client-mock', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...(originalModule as any),
    // We don't need to override mockClient here if we use the stored one
  };
});

// Suppress logger output during tests
vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

describe('CognitoService', () => {
  let service: CognitoService;
  const cognitoClientMock = actualMockClient(CognitoIdentityProviderClient);

  const mockUserPoolId = 'us-east-1_testPool';
  const mockAwsRegion = 'us-east-1';

  beforeEach(async () => {
    cognitoClientMock.reset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitoService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'AWS_REGION') return mockAwsRegion;
              return undefined;
            }),
            getOrThrow: vi.fn((key: string) => {
              if (key === 'COGNITO_USER_POOL_ID') return mockUserPoolId;
              throw new Error(`Configuration key ${key} not found`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CognitoService>(CognitoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAttribute', () => {
    const mockUserId = 'test-user-id';
    const mockAttributeName = 'custom:testAttribute';
    const mockAttributeValue = 'test-value';

    it('should return attribute value when found', async () => {
      cognitoClientMock.on(AdminGetUserCommand).resolves({
        UserAttributes: [
          { Name: mockAttributeName, Value: mockAttributeValue },
        ],
      });

      const result = await service.getUserAttribute(
        mockUserId,
        mockAttributeName,
      );
      expect(result).toBe(mockAttributeValue);
      expect(
        cognitoClientMock.commandCalls(AdminGetUserCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: mockUserPoolId,
        Username: mockUserId,
      });
    });

    it('should return null when attribute is not found', async () => {
      cognitoClientMock.on(AdminGetUserCommand).resolves({
        UserAttributes: [{ Name: 'otherAttribute', Value: 'otherValue' }],
      });

      const result = await service.getUserAttribute(
        mockUserId,
        mockAttributeName,
      );
      expect(result).toBeNull();
    });

    it('should return null when UserAttributes is undefined', async () => {
      cognitoClientMock.on(AdminGetUserCommand).resolves({}); // No UserAttributes

      const result = await service.getUserAttribute(
        mockUserId,
        mockAttributeName,
      );
      expect(result).toBeNull();
    });

    it('should return null and log error on CognitoIdentityProviderServiceException', async () => {
      const error = new CognitoIdentityProviderServiceException({
        name: 'UserNotFoundException',
        $metadata: {},
      } as any);
      error.name = 'UserNotFoundException'; // Ensure name is set for the logger
      cognitoClientMock.on(AdminGetUserCommand).rejects(error);
      const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error');

      const result = await service.getUserAttribute(
        mockUserId,
        mockAttributeName,
      );
      expect(result).toBeNull();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Cognito error for user ${mockUserId} when getting attribute ${mockAttributeName}: UserNotFoundException - `,
      );
    });

    it('should return null and log error on generic error', async () => {
      const error = new Error('Generic error');
      cognitoClientMock.on(AdminGetUserCommand).rejects(error);
      const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error');

      const result = await service.getUserAttribute(
        mockUserId,
        mockAttributeName,
      );
      expect(result).toBeNull();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Failed to get attribute ${mockAttributeName} for user ${mockUserId}`,
        error.stack,
      );
    });
  });

  describe('getUserLanguage', () => {
    const mockUserId = 'test-user-id';

    it('should return language code from getUserAttribute', async () => {
      const mockLanguageCode = 'fr';
      const getUserAttributeSpy = vi
        .spyOn(service, 'getUserAttribute')
        .mockResolvedValue(mockLanguageCode);

      const result = await service.getUserLanguage(mockUserId);
      expect(result).toBe(mockLanguageCode);
      expect(getUserAttributeSpy).toHaveBeenCalledWith(
        mockUserId,
        'custom:language_code',
      );
    });

    it('should return "en" when getUserAttribute returns null', async () => {
      const getUserAttributeSpy = vi
        .spyOn(service, 'getUserAttribute')
        .mockResolvedValue(null);

      const result = await service.getUserLanguage(mockUserId);
      expect(result).toBe('en');
      expect(getUserAttributeSpy).toHaveBeenCalledWith(
        mockUserId,
        'custom:language_code',
      );
    });
  });

  describe('getUserDeviceToken', () => {
    const mockUserId = 'test-user-id';

    it('should return device token from getUserAttribute', async () => {
      const mockDeviceToken = 'test-device-token';
      const getUserAttributeSpy = vi
        .spyOn(service, 'getUserAttribute')
        .mockResolvedValue(mockDeviceToken);

      const result = await service.getUserDeviceToken(mockUserId);
      expect(result).toBe(mockDeviceToken);
      expect(getUserAttributeSpy).toHaveBeenCalledWith(
        mockUserId,
        'custom:devicetoken',
      );
    });

    it('should return null when getUserAttribute returns null', async () => {
      const getUserAttributeSpy = vi
        .spyOn(service, 'getUserAttribute')
        .mockResolvedValue(null);

      const result = await service.getUserDeviceToken(mockUserId);
      expect(result).toBeNull();
      expect(getUserAttributeSpy).toHaveBeenCalledWith(
        mockUserId,
        'custom:devicetoken',
      );
    });
  });
});
