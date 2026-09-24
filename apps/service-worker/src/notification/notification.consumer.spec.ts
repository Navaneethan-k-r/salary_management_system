import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumer } from './notification.consumer';
import { EmailService } from './email.service';
import * as amqplib from 'amqplib';
import { EMPLOYEE_CREATED_QUEUE, EmployeeCreatedEvent } from '@salary-mgmt/shared-types';

vi.mock('amqplib');

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let emailService: EmailService;

  const mockChannel = {
    assertQueue: vi.fn(),
    prefetch: vi.fn(),
    consume: vi.fn(),
    ack: vi.fn(),
    nack: vi.fn(),
    close: vi.fn(),
  };

  const mockConnection = {
    createChannel: vi.fn().mockResolvedValue(mockChannel),
    close: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(amqplib.connect).mockResolvedValue(mockConnection as any);

    emailService = {
      sendOnboardingEmail: vi.fn(),
    } as any;

    consumer = new NotificationConsumer(emailService);
  });

  it('connects to RabbitMQ and consumes messages on init', async () => {
    await consumer.onModuleInit();

    expect(amqplib.connect).toHaveBeenCalled();
    expect(mockConnection.createChannel).toHaveBeenCalled();
    expect(mockChannel.assertQueue).toHaveBeenCalledWith(EMPLOYEE_CREATED_QUEUE, { durable: true });
    expect(mockChannel.consume).toHaveBeenCalledWith(EMPLOYEE_CREATED_QUEUE, expect.any(Function));
  });

  it('acks the message and sends email when processing is successful', async () => {
    await consumer.onModuleInit();
    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    const event: EmployeeCreatedEvent = {
      employeeId: 'emp-1',
      email: 'test@example.com',
      fullName: 'Test User',
      organizationId: 'org-1',
      activationToken: 'token-123',
    };

    const mockMessage = {
      content: Buffer.from(JSON.stringify(event)),
    };

    vi.mocked(emailService.sendOnboardingEmail).mockResolvedValue(undefined);

    await consumeCallback(mockMessage);

    expect(emailService.sendOnboardingEmail).toHaveBeenCalledWith(event);
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it('nacks and requeues the message when email sending fails', async () => {
    await consumer.onModuleInit();
    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    const event: EmployeeCreatedEvent = {
      employeeId: 'emp-1',
      email: 'test@example.com',
      fullName: 'Test User',
      organizationId: 'org-1',
      activationToken: 'token-123',
    };

    const mockMessage = {
      content: Buffer.from(JSON.stringify(event)),
    };

    vi.mocked(emailService.sendOnboardingEmail).mockRejectedValue(new Error('Zapier down'));

    await consumeCallback(mockMessage);

    expect(emailService.sendOnboardingEmail).toHaveBeenCalledWith(event);
    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true); // requeue = true
  });
});
