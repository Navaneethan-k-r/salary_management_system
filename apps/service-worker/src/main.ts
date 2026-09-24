import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from apps/service-worker/.env or root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('ServiceWorker');
  // Create a microservice or a standalone app. We'll use a standalone app for simplicity.
  // We can just use the standard app context because we are not using the NestJS
  // Microservices module for RabbitMQ, but rather amqplib directly in OnModuleInit.
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  logger.log('Service Worker is running...');
}

bootstrap();
