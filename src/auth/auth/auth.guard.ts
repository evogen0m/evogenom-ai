import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { AppConfigType } from 'src/config';
import { z } from 'zod';
import { UserPrincipal } from '../UserPrincipal';
const openIdConfigSchema = z.object({
  jwks_uri: z.string().url(),
  issuer: z.string().url(),
});

@Injectable()
export class AuthGuard implements CanActivate, OnApplicationBootstrap {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly configService: ConfigService<AppConfigType>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization header is required');
    }

    const token = authHeader.substring(7);

    try {
      const openIdConfig = await fetch(
        this.configService.get('OPENID_CONFIG_URL')!,
      ).then(async (res) => openIdConfigSchema.parse(await res.json()));

      const { payload } = await jose.jwtVerify(token, this.jwks, {
        issuer: openIdConfig.issuer,
      });
      request.user = {
        id: payload.sub,
        evogenomApiToken: token,
      } as UserPrincipal;
      return true;
    } catch (error) {
      this.logger.warn('Error verifying token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  jwks: ReturnType<typeof jose.createRemoteJWKSet>;

  async onApplicationBootstrap() {
    const openIdConfig = await fetch(
      this.configService.get('OPENID_CONFIG_URL')!,
    ).then(async (res) => openIdConfigSchema.parse(await res.json()));

    this.jwks = jose.createRemoteJWKSet(new URL(openIdConfig.jwks_uri));
    await this.jwks.reload();
  }
}
