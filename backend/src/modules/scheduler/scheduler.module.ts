import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../messages/entities/message.entity';
import { SchedulerService } from './scheduler.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Message]),
    MessagesModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}

