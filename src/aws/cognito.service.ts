import {
  AdminGetUserCommand,
  AdminGetUserCommandOutput,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as memoizee from 'memoizee';
import { AppConfigType } from 'src/config';

// JS life
const memoizeFn = memoizee.default || memoizee;

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly _fetchUserProfile: (
    userId: string,
  ) => Promise<AdminGetUserCommandOutput>;

  constructor(private readonly configService: ConfigService<AppConfigType>) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('AWS_REGION') || 'eu-west-1',
    });
    this.userPoolId = this.configService.getOrThrow<string>(
      'COGNITO_USER_POOL_ID',
    );

    this._fetchUserProfile = memoizeFn(
      async (userId: string): Promise<AdminGetUserCommandOutput> => {
        this.logger.debug(
          `Fetching user profile directly from Cognito for userId: ${userId}`,
        );
        const command = new AdminGetUserCommand({
          UserPoolId: this.userPoolId,
          Username: userId,
        });
        try {
          const result = await this.cognitoClient.send(command);
          return result;
        } catch (error) {
          this.logger.error(
            `Cognito API error in _fetchUserProfile for user ${userId}:`,
            error instanceof Error ? error.stack : String(error),
          );
          throw error;
        }
      },
      {
        maxAge: 5 * 60 * 1000,
        max: 100,
        promise: true,
        normalizer: (args: [string]) => args[0],
      },
    );
  }

  async getUserAttribute(
    userId: string,
    attributeName: string,
  ): Promise<string | null> {
    try {
      const userProfile = await this._fetchUserProfile(userId);
      const attribute = userProfile.UserAttributes?.find(
        (attr) => attr.Name === attributeName,
      );
      return attribute?.Value || null;
    } catch (error) {
      if (error instanceof CognitoIdentityProviderServiceException) {
        this.logger.error(
          `Cognito error for user ${userId} when getting attribute ${attributeName}: ${error.name} - ${error.message}`,
        );
      } else {
        this.logger.error(
          `Failed to get attribute ${attributeName} for user ${userId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      return null;
    }
  }

  async getUserLanguage(userId: string): Promise<string> {
    const languageCode = await this.getUserAttribute(
      userId,
      'custom:language_code',
    );
    return languageCode || 'en';
  }

  async getUserDeviceToken(userId: string): Promise<string | null> {
    return this.getUserAttribute(userId, 'custom:devicetoken');
  }
}
