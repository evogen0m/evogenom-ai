import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DbModule } from '../db/db.module';
import { NotificationModule } from '../notification/notification.module';
import { FollowUpService } from './followup.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DbModule,
    NotificationModule,
  ],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
