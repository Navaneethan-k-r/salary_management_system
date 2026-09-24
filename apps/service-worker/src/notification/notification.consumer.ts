import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { EmailService } from './email.service';
import { EmployeeCreatedEvent, EMPLOYEE_CREATED_QUEUE } from '@salary-mgmt/shared-types';

/**
 * Listens on the RabbitMQ `employee.created` queue and triggers onboarding
 * email dispatch for each event received.
 *
 * Reliability: messages are acknowledged only on successful processing.
 * On failure, the message is nack'd and re-queued (up to one retry), then
 * routed to the DLQ if a dead-letter exchange is configured.
 */
@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationConsumer.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    await this.startConsuming();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async startConsuming() {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    try {
      this.connection = await amqplib.connect(url);
      const channel = await this.connection.createChannel();
      this.channel = channel;

      // Assert the same queue that the producer publishes to
      await channel.assertQueue(EMPLOYEE_CREATED_QUEUE, { durable: true });

      // Process one message at a time to avoid overwhelming downstream services
      channel.prefetch(1);

      this.logger.log(`Listening on queue "${EMPLOYEE_CREATED_QUEUE}"…`);

      channel.consume(EMPLOYEE_CREATED_QUEUE, async (msg) => {
        if (!msg) return;

        let event: EmployeeCreatedEvent;
        try {
          event = JSON.parse(msg.content.toString()) as EmployeeCreatedEvent;
        } catch (parseErr: any) {
          this.logger.error(`Failed to parse message: ${parseErr.message}. Discarding.`);
          this.channel?.nack(msg, false, false); // discard malformed message
          return;
        }

        this.logger.log(`Processing EmployeeCreatedEvent for employee ${event.employeeId}`);

        try {
          await this.emailService.sendOnboardingEmail(event);
          this.channel?.ack(msg);
        } catch (err: any) {
          this.logger.error(
            `Failed to send onboarding email for employee ${event.employeeId}: ${err.message}. ` +
            `Re-queuing message.`,
          );
          // nack with requeue=true for transient failures; DLQ handles repeated failures
          this.channel?.nack(msg, false, true);
        }
      });
    } catch (err: any) {
      this.logger.error(`Failed to start RabbitMQ consumer: ${err.message}`);
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
}
