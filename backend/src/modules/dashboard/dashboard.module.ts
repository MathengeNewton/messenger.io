import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Message } from '../messages/entities/message.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Group } from '../groups/entities/group.entity';
import { SmsProviderModule } from '../sms-provider/sms-provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Contact, Group]),
    SmsProviderModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}


