import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Message, MessageStatus } from '../messages/entities/message.entity';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
  ) {}

  // Run every minute to check for scheduled messages
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledMessages() {
    const now = new Date();
    
    // Find all scheduled messages that should be sent now
    const scheduledMessages = await this.messageRepo.find({
      where: {
        status: MessageStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
    });

    if (scheduledMessages.length === 0) {
      return;
    }

    this.logger.log(`Processing ${scheduledMessages.length} scheduled message(s)`);

    // Process each scheduled message
    for (const message of scheduledMessages) {
      try {
        // Update status to PENDING and send
        message.status = MessageStatus.PENDING;
        await this.messageRepo.save(message);
        
        // Send the message (this will update status to SENT or FAILED)
        await this.messagesService.sendMessage(message.id);
        
        this.logger.log(`Sent scheduled message ${message.id}`);
      } catch (error) {
        this.logger.error(`Failed to send scheduled message ${message.id}: ${error.message}`);
        message.status = MessageStatus.FAILED;
        await this.messageRepo.save(message);
      }
    }
  }
}

