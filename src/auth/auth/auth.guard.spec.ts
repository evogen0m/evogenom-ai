import {
  BadRequestException,
  Controller,
  ExecutionContext,
  Get,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as jose from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../decorators';
import { UserPrincipal } from '../UserPrincipal';
import { AuthGuard } from './auth.guard';

// Use vi.hoisted for mocks used within vi.mock factory
const mocks = vi.hoisted(() => {
  return {
    mockJwtVerify: vi.fn(),
    mockCreateRemoteJWKSet: vi.fn(),
    mockReload: vi.fn(),
  };
});

vi.mock('jose', async (importOriginal) => {
  const original = await importOriginal<typeof jose>();
  return {
    ...original,
    jwtVerify: mocks.mockJwtVerify, // Reference hoisted mock
    createRemoteJWKSet: mocks.mockCreateRemoteJWKSet, // Reference hoisted mock
  };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// --- Test Setup ---
const MOCK_OPENID_CONFIG_URL =
  'http://localhost/.well-known/openid-configuration';
const MOCK_JWKS_URI = 'http://localhost/.well-known/jwks.json';
const MOCK_ISSUER = 'http://localhost/';
const MOCK_TOKEN = 'mock.jwt.token';
const MOCK_USER_ID = 'test-user-id';

const mockOpenIdConfig = {
  jwks_uri: MOCK_JWKS_URI,
  issuer: MOCK_ISSUER,
};

// A minimal controller to apply the guard for testing
@Controller('test')
class TestController {
  @Get()
  @UseGuards(AuthGuard)
  getProtectedResource(@User() user: UserPrincipal) {
    return { message: 'Success', userId: user.id };
  }
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let module: TestingModule;

  // Mock ExecutionContext
  const createMockExecutionContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: headers.authorization,
      },
      user: undefined as UserPrincipal | undefined, // Ensure user property exists
    };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getClass: vi.fn(),
      getHandler: vi.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset the hoisted mocks directly
    mocks.mockCreateRemoteJWKSet.mockReturnValue({ reload: mocks.mockReload });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockOpenIdConfig,
      status: 200,
      statusText: 'OK',
    } as Response);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ OPENID_CONFIG_URL: MOCK_OPENID_CONFIG_URL })],
        }),
      ],
      providers: [AuthGuard],
      controllers: [TestController], // Include the guard and controller
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);

    // Manually trigger bootstrap logic after module creation and mocks are set
    await guard.onApplicationBootstrap();

    // Ensure JWKS setup is mocked correctly after bootstrap
    expect(mockFetch).toHaveBeenCalledWith(MOCK_OPENID_CONFIG_URL);
    expect(mocks.mockCreateRemoteJWKSet).toHaveBeenCalledWith(
      new URL(MOCK_JWKS_URI),
    );
    expect(mocks.mockReload).toHaveBeenCalled();
    vi.clearAllMocks(); // Clear mocks again after bootstrap setup calls
    // Reset hoisted mocks for canActivate tests
    mocks.mockCreateRemoteJWKSet.mockReturnValue({ reload: mocks.mockReload });
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('when validating a request (canActivate)', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      // Setup default successful mocks for canActivate
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOpenIdConfig,
        status: 200,
        statusText: 'OK',
      } as Response);
      mocks.mockJwtVerify.mockResolvedValue({
        payload: { sub: MOCK_USER_ID },
        protectedHeader: {},
        key: {} as jose.KeyLike,
      });
      context = createMockExecutionContext({
        authorization: `Bearer ${MOCK_TOKEN}`,
      });
    });

    it('should return true and attach user principal for a valid token', async () => {
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user).toBeDefined();
      expect(request.user.id).toBe(MOCK_USER_ID);
      expect(request.user.evogenomApiToken).toBe(MOCK_TOKEN);
      expect(mockFetch).toHaveBeenCalledWith(MOCK_OPENID_CONFIG_URL);
      expect(mocks.mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, guard.jwks, {
        issuer: MOCK_ISSUER,
      });
    });

    it('should throw BadRequestException if Authorization header is missing', async () => {
      context = createMockExecutionContext(); // No auth header

      await expect(guard.canActivate(context)).rejects.toThrow(
        BadRequestException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header is required',
      );
    });

    it('should throw BadRequestException if Authorization header does not start with "Bearer "', async () => {
      context = createMockExecutionContext({
        authorization: `Basic ${MOCK_TOKEN}`,
      }); // Wrong scheme

      await expect(guard.canActivate(context)).rejects.toThrow(
        BadRequestException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header is required', // Message remains the same due to check order
      );
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      const verificationError = new Error('JOSEError: verification failed');
      mocks.mockJwtVerify.mockRejectedValue(verificationError);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
      expect(mocks.mockJwtVerify).toHaveBeenCalledWith(MOCK_TOKEN, guard.jwks, {
        issuer: MOCK_ISSUER,
      });
    });
  });

  describe('when initializing (onApplicationBootstrap)', () => {
    // Helper to recreate the module and guard for bootstrap tests
    const reinitializeGuard = async (
      configOverrides = {},
      fetchMockImplementation?: any,
    ) => {
      if (fetchMockImplementation) {
        mockFetch.mockImplementation(fetchMockImplementation);
      } else {
        mockFetch.mockResolvedValue({
          // Default success mock
          ok: true,
          json: async () => mockOpenIdConfig,
          status: 200,
          statusText: 'OK',
        } as Response);
      }

      // Reference hoisted mock
      mocks.mockCreateRemoteJWKSet.mockReturnValue({
        reload: mocks.mockReload,
      });

      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                OPENID_CONFIG_URL: MOCK_OPENID_CONFIG_URL,
                ...configOverrides,
              }),
            ],
          }),
        ],
        providers: [AuthGuard],
      }).compile();
      const testGuard = testModule.get<AuthGuard>(AuthGuard);
      // Manually trigger bootstrap logic
      await expect(testGuard.onApplicationBootstrap()).resolves.toBeUndefined();
      return testGuard;
    };

    it('should initialize JWKS successfully with valid config', async () => {
      vi.clearAllMocks(); // Clear mocks before re-initializing
      const initializedGuard = await reinitializeGuard();
      expect(initializedGuard.jwks).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(MOCK_OPENID_CONFIG_URL);
      expect(mocks.mockCreateRemoteJWKSet).toHaveBeenCalledWith(
        new URL(MOCK_JWKS_URI),
      );
      expect(mocks.mockReload).toHaveBeenCalledTimes(1); // Called once during bootstrap
    });
  });
});
