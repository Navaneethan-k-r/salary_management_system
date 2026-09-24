import { Module } from '@nestjs/common';
import { NotificationConsumer } from './notification.consumer';
import { EmailService } from './email.service';

@Module({
  providers: [NotificationConsumer, EmailService],
})
export class NotificationModule {}
