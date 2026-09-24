import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { EmployeeCreatedEvent, EMPLOYEE_CREATED_QUEUE } from '../events/employee.events';

/**
 * Publishes domain events to RabbitMQ.
 * Uses a durable queue so messages survive broker restarts.
 * On publish failure, logs the error but does NOT throw — the HTTP request
 * must not be blocked by messaging failures (per spec constraint).
 */
@Injectable()
export class RabbitMQPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisherService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect() {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    try {
      this.connection = await amqplib.connect(url);
      const channel = await this.connection.createChannel();
      this.channel = channel;
      await channel.assertQueue(EMPLOYEE_CREATED_QUEUE, { durable: true });
      this.logger.log(`Connected to RabbitMQ. Queue "${EMPLOYEE_CREATED_QUEUE}" ready.`);
    } catch (err: any) {
      this.logger.error(`Failed to connect to RabbitMQ: ${err.message}. Events will not be published.`);
    }
  }

  private async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Best-effort cleanup
    }
  }

  async publishEmployeeCreated(event: EmployeeCreatedEvent): Promise<void> {
    if (!this.channel) {
      this.logger.error(
        `[EmployeeCreatedEvent] Cannot publish — RabbitMQ channel not available. ` +
        `Employee ${event.employeeId} will not receive an onboarding email.`,
      );
      return;
    }
    try {
      const payload = Buffer.from(JSON.stringify(event));
      this.channel.sendToQueue(EMPLOYEE_CREATED_QUEUE, payload, { persistent: true });
      this.logger.log(`[EmployeeCreatedEvent] Published for employee ${event.employeeId}`);
    } catch (err: any) {
      this.logger.error(`[EmployeeCreatedEvent] Publish failed for employee ${event.employeeId}: ${err.message}`);
    }
  }
}
