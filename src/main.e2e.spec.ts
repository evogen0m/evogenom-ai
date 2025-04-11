import { INestApplication } from '@nestjs/common';
import * as net from 'net';
import { AddressInfo } from 'net';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bootstrap } from './main';

const checkAvailablePort = (options) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);

    server.listen(options, () => {
      const port = (server.address() as AddressInfo).port;
      server.close(() => {
        resolve(port);
      });
    });
  });

const getAvailablePort = async (options, hosts) => {
  if (options.host || options.port === 0) {
    return checkAvailablePort(options);
  }

  for (const host of hosts) {
    try {
      await checkAvailablePort({ port: options.port, host });
    } catch (error) {
      if (!['EADDRNOTAVAIL', 'EINVAL'].includes(error.code)) {
        throw error;
      }
    }
  }

  return options.port;
};
describe('Application Bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const port = await getAvailablePort({ port: 0 }, ['localhost']);
    process.env.PORT = port.toString();
    app = await bootstrap();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('when application starts', () => {
    it('should create a working HTTP server', async () => {
      // Check if the HTTP server is running by making a request to the root endpoint
      const response = await request(app.getHttpServer()).get('/');
      expect(response.status).toBeDefined();
    });

    it('should set up Swagger documentation', async () => {
      // Check if Swagger UI is set up correctly
      const response = await request(app.getHttpServer()).get('/api');
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
    });
  });
});
