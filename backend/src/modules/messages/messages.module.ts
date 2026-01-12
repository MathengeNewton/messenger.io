import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { MessageRecipient } from './entities/message-recipient.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Group } from '../groups/entities/group.entity';
import { SmsProviderModule } from '../sms-provider/sms-provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageRecipient, Contact, Group]),
    SmsProviderModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}


