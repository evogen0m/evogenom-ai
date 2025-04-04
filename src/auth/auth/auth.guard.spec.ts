import {
  BadRequestException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as jose from 'jose';
import * as nock from 'nock';
import { AppConfigType } from 'src/config';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const OPENID_CONFIG_URL =
    'https://auth.example.com/.well-known/openid-configuration';
  const JWKS_URI = 'https://auth.example.com/jwks';
  const ISSUER = 'https://auth.example.com';

  // Key material for tests
  let keyPair: { publicKey: any; privateKey: any };
  let jwks: jose.JSONWebKeySet;
  let signedToken: string;
  let mockSub: string;

  // Create a valid OpenID configuration
  const validOpenIdConfig = {
    jwks_uri: JWKS_URI,
    issuer: ISSUER,
  };

  // Setup key material and token before tests
  beforeAll(async () => {
    // Generate a key pair
    keyPair = await jose.generateKeyPair('RS256');
    mockSub = 'user123';

    // Export the public key as JWK
    const publicJwk = await jose.exportJWK(keyPair.publicKey);
    publicJwk.kid = 'test-key-id';
    publicJwk.use = 'sig';
    publicJwk.alg = 'RS256';

    // Create a JWKS with the public key
    jwks = {
      keys: [publicJwk],
    };

    // Create a signed token
    signedToken = await new jose.SignJWT({ sub: mockSub })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(keyPair.privateKey);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset nock to ensure no interceptors from previous tests
    nock.cleanAll();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'OPENID_CONFIG_URL') {
                return OPENID_CONFIG_URL;
              }
              return null;
            }),
          } as unknown as ConfigService<AppConfigType>,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  // Helper function to set up mocks
  const setupMocks = () => {
    // Mock the OpenID config endpoint
    const openIdConfigScope = nock('https://auth.example.com')
      .get('/.well-known/openid-configuration')
      .reply(200, validOpenIdConfig);

    // Mock the JWKS endpoint with the correct URL path
    const jwksScope = nock('https://auth.example.com')
      .get('/jwks')
      .reply(200, jwks);

    return { openIdConfigScope, jwksScope };
  };

  describe('onApplicationBootstrap', () => {
    it('should fetch OpenID configuration and create JWKS', async () => {
      const { openIdConfigScope, jwksScope } = setupMocks();

      await guard.onApplicationBootstrap();

      // Verify the endpoints were called
      expect(openIdConfigScope.isDone()).toBe(true);
      expect(jwksScope.isDone()).toBe(true);

      // Verify the JWKS was set properly
      expect(guard.jwks).toBeDefined();
    });

    it('should throw error if OpenID configuration is invalid', async () => {
      // Mock the fetch request with invalid config
      const openIdConfigScope = nock('https://auth.example.com')
        .get('/.well-known/openid-configuration')
        .reply(200, { invalid: 'config' });

      await expect(guard.onApplicationBootstrap()).rejects.toThrow();

      // Assert the endpoint was called
      expect(openIdConfigScope.isDone()).toBe(true);
    });
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(async () => {
      mockRequest = {
        headers: {},
        user: undefined,
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      // Set up JWKS for each test by initializing the guard
      const { openIdConfigScope, jwksScope } = setupMocks();

      await guard.onApplicationBootstrap();

      expect(openIdConfigScope.isDone()).toBe(true);
      expect(jwksScope.isDone()).toBe(true);

      // Clear nock interceptors after setup
      nock.cleanAll();
    });

    it('should throw BadRequestException if no authorization header is present', async () => {
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if authorization header does not start with Bearer', async () => {
      mockRequest.headers.authorization = 'Basic sometoken';
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return true and set user if token is valid', async () => {
      // Setup auth header with our signed token
      mockRequest.headers.authorization = `Bearer ${signedToken}`;

      const { openIdConfigScope } = setupMocks();

      // For this test, we'll mock the JWKS one more time
      nock('https://auth.example.com').get('/jwks').reply(200, jwks);

      const result = await guard.canActivate(mockExecutionContext);

      // Assert the OpenID config endpoint was called during validation
      expect(openIdConfigScope.isDone()).toBe(true);

      // Verify the token was properly validated
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({ id: mockSub });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      // Setup auth header with an invalid token
      mockRequest.headers.authorization = `Bearer invalid.token.here`;

      // Mock OpenID config fetch for token verification
      const openIdConfigScope = nock('https://auth.example.com')
        .get('/.well-known/openid-configuration')
        .reply(200, validOpenIdConfig);

      // Mock JWKS endpoint again for this test
      nock('https://auth.example.com')
        .get('/jwks')
        .optionally() // Make it optional since it might not be called if validation fails early
        .reply(200, jwks);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );

      // Assert the OpenID config endpoint was called
      expect(openIdConfigScope.isDone()).toBe(true);
    });

    it('should throw UnauthorizedException if OpenID config fetch fails', async () => {
      // Setup auth header with our valid token
      mockRequest.headers.authorization = `Bearer ${signedToken}`;

      // Mock failed OpenID config fetch
      const openIdConfigScope = nock('https://auth.example.com')
        .get('/.well-known/openid-configuration')
        .reply(500);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );

      // Assert the endpoint was called
      expect(openIdConfigScope.isDone()).toBe(true);
    });

    it('should throw UnauthorizedException if JWKS fetch fails during verification', async () => {
      // Reset the guard's JWKS
      guard.jwks = undefined as any;

      // Setup auth header
      mockRequest.headers.authorization = `Bearer ${signedToken}`;

      // Mock OpenID config fetch
      const openIdConfigScope = nock('https://auth.example.com')
        .get('/.well-known/openid-configuration')
        .reply(200, validOpenIdConfig);

      // Mock JWKS endpoint to fail
      nock('https://auth.example.com').get('/jwks').reply(500);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify JWKS endpoint was called when jwks property not initialized
      expect(openIdConfigScope.isDone()).toBe(true);
    });
  });
});
