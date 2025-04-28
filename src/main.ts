//this should be the first import in the file
import './instrument';

import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import { AppModule } from './app.module';
import { DRIZZLE_INSTANCE } from './db/drizzle.provider';

/**
 * Checks if the --migrate flag is present in command line arguments
 * @returns boolean indicating if migration should be run
 */
function shouldMigrate(): boolean {
  return process.argv.includes('--migrate');
}

const bootStrapLogger = new Logger('bootstrap');

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === 'production',
    }),
  });

  // Enable CORS for frontend requests
  app.enableCors();

  const openapiConfig = new DocumentBuilder()
    .setTitle('Evogenomai API')
    .setDescription('Evogenomai API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, openapiConfig);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());

  app.enableShutdownHooks();

  if (shouldMigrate()) {
    const instance = app.get(DRIZZLE_INSTANCE);
    const migrationsFolder = path.join(__dirname, '../drizzle');
    bootStrapLogger.log(`Applying migrations from ${migrationsFolder}`);
    await migrate(instance, {
      migrationsFolder,
    });
    bootStrapLogger.log('Migrations applied');
  } else {
    bootStrapLogger.log('Migrations are not enabled');
  }

  bootStrapLogger.log(`Starting server on port ${process.env.PORT}`);
  await app.listen(process.env.PORT ?? 3000);
  return app;
}
bootstrap().catch((error) => {
  bootStrapLogger.error(error);
  process.exit(1);
});
