import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [ConfigModule, AwsModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
