import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const logger = new Logger('EarnXpressBootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers & Cookie Parsing
  app.use(helmet());
  app.use(cookieParser(process.env.COOKIE_SECRET || 'dev_cookie_secret_earnxpress_secure_789!'));

  // 2. Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? ['https://earnxpress.com'] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-EarnXpress-Client', 'X-App-Version'],
  });

  // 3. API Global Prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // 4. Global Validation Pipe (Strict Whitelist & Forbid Non-Whitelisted)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 5. Global Exception Filter & Response Transform Interceptor
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // 6. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EarnXpress API')
    .setDescription('Open International Task Marketplace — Headless RESTful API Specification (OpenAPI 3.1)')
    .setVersion('1.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 7. Start HTTP Server
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`EarnXpress Backend running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`OpenAPI Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
