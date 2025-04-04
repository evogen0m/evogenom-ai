import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const openapiConfig = new DocumentBuilder()
    .setTitle('Evogenomai API')
    .setDescription('Evogenomai API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, openapiConfig);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());

  console.log(`Starting server on port ${process.env.PORT}`);
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
