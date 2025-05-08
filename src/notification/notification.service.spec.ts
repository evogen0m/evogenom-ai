import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CognitoService } from 'src/aws/cognito.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { Notification } from './notification.types';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: vi.fn(() => ({
      send: vi.fn(),
    })),
    AdminGetUserCommand: vi.fn(),
  };
});

// Mock Firebase Admin
vi.mock('firebase-admin/app', () => {
  return {
    cert: vi.fn(),
    initializeApp: vi.fn(() => ({})),
  };
});

vi.mock('firebase-admin/messaging', () => {
  return {
    getMessaging: vi.fn(() => ({
      send: vi.fn().mockResolvedValue('message-id'),
    })),
  };
});

const mockCognitoService = {
  getUserDeviceToken: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    if (key === 'AWS_REGION') return 'us-east-1';
    if (key === 'COGNITO_USER_POOL_ID') return 'test-user-pool-id';
    if (key === 'FIREBASE_SERVICE_ACCOUNT')
      return JSON.stringify({
        projectId: 'test-project-id',
        clientEmail: 'test-client-email@example.com',
        privateKey: 'test-private-key',
      });
    return undefined;
  }),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CognitoService,
          useValue: mockCognitoService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    const userId = 'test-user-id';
    const notification: Notification = {
      title: 'Test Title',
      body: 'Test Body',
    };

    it('should send a notification when device token is found', async () => {
      // Mock the getUserDeviceToken method to return a token
      mockCognitoService.getUserDeviceToken.mockResolvedValue(
        'test-device-token',
      );
      vi.spyOn(service as any, 'sendFirebaseNotification').mockResolvedValue(
        undefined,
      );

      await service.sendNotification(userId, notification);

      expect(mockCognitoService.getUserDeviceToken).toHaveBeenCalledWith(
        userId,
      );
      expect(service['sendFirebaseNotification']).toHaveBeenCalledWith(
        'test-device-token',
        notification,
      );
    });

    it('should not send a notification when no device token is found', async () => {
      // Mock the getUserDeviceToken method to return null
      mockCognitoService.getUserDeviceToken.mockResolvedValue(null);
      vi.spyOn(service as any, 'sendFirebaseNotification').mockResolvedValue(
        undefined,
      );

      await service.sendNotification(userId, notification);

      expect(mockCognitoService.getUserDeviceToken).toHaveBeenCalledWith(
        userId,
      );
      expect(service['sendFirebaseNotification']).not.toHaveBeenCalled();
    });

    it('should throw an error if sending notification fails', async () => {
      // Mock the getUserDeviceToken method to return a token
      mockCognitoService.getUserDeviceToken.mockResolvedValue(
        'test-device-token',
      );
      // Mock sendFirebaseNotification to throw an error
      vi.spyOn(service as any, 'sendFirebaseNotification').mockRejectedValue(
        new Error('Test error'),
      );

      await expect(
        service.sendNotification(userId, notification),
      ).rejects.toThrow('Test error');
    });
  });
});
