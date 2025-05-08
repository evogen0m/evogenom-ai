import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Message, getMessaging } from 'firebase-admin/messaging';
import { CognitoService } from 'src/aws/cognito.service';
import { AppConfigType } from 'src/config';
import { Notification } from './notification.types';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseApp: App;

  constructor(
    private readonly configService: ConfigService<AppConfigType>,
    private readonly cognitoService: CognitoService,
  ) {
    // Removed Cognito client initialization
  }

  /**
   * Initialize Firebase when the module is initialized
   */
  async onModuleInit() {
    try {
      await this.initializeFirebase();
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  /**
   * Initialize Firebase with service account from config
   */
  private async initializeFirebase(): Promise<void> {
    const serviceAccount = this.configService.getOrThrow<string>(
      'FIREBASE_SERVICE_ACCOUNT',
    );

    // Parse the service account JSON if it's a string
    const parsedServiceAccount =
      typeof serviceAccount === 'string'
        ? JSON.parse(serviceAccount)
        : serviceAccount;

    this.firebaseApp = initializeApp({
      credential: cert(parsedServiceAccount),
    });
  }

  /**
   * Sends a push notification to a user
   * @param userId The Cognito user ID
   * @param notification The notification to send
   * @returns A promise that resolves when the notification is sent
   */
  async sendNotification(
    userId: string,
    notification: Notification,
  ): Promise<void> {
    try {
      // Get the user's device token using CognitoService
      const deviceToken = await this.cognitoService.getUserDeviceToken(userId);

      if (!deviceToken) {
        this.logger.warn(`No device token found for user ${userId}`);
        return;
      }

      // Send the notification via Firebase
      await this.sendFirebaseNotification(deviceToken, notification);
      this.logger.log(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Sends a notification via Firebase Cloud Messaging
   * @param deviceToken The FCM device token
   * @param notification The notification to send
   */
  private async sendFirebaseNotification(
    deviceToken: string,
    notification: Notification,
  ): Promise<void> {
    try {
      const messaging = getMessaging(this.firebaseApp);

      const message: Message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        android: {
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
        // FCM handles delivery to the appropriate platform
        webpush: {
          notification: {
            icon: '/firebase-logo.png',
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      const response = await messaging.send(message);
      this.logger.debug(`FCM Response: ${response}`);
    } catch (error) {
      this.logger.error('Failed to send Firebase notification', error);
      throw error;
    }
  }
}
