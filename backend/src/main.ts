﻿import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { appConfig } from './config';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { TraceIdInterceptor } from './shared/interceptors/trace-id.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.enableCors({ origin: appConfig.corsOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TraceIdInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(appConfig.port);
  logger.log(`Governance backend running on port ${appConfig.port}`);
}
bootstrap();
