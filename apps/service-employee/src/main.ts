import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from apps/service-employee/.env or root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('ServiceEmployee');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Enable request payload validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Enable graceful shutdown hooks for clean event loop release (db pools, redis connections)
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '3333', 10);
  await app.listen(port);

  // 1. service-employee running on url: server url
  const serverUrl = `http://localhost:${port}/api`;
  logger.log(`service-employee running on url: ${serverUrl}`);

  // 2. service-employee database connected : database url
  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '3306';
      const dbName = process.env.DB_DATABASE || 'salary_management';
      const databaseUrl = `mysql://${dbHost}:${dbPort}/${dbName}`;
      logger.log(`service-employee database connected : ${databaseUrl}`);
    }
  } catch (err: any) {
    logger.warn(`Could not verify database connection status: ${err.message}`);
  }
}

bootstrap();
