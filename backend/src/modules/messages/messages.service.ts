import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message, MessageStatus, RecipientType } from './entities/message.entity';
import { MessageRecipient, RecipientStatus } from './entities/message-recipient.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SmsProviderService, SmsResponse } from '../sms-provider/sms-provider.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    private readonly smsProviderService: SmsProviderService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
    status?: MessageStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: Message[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.messageRepo.createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sentBy')
      .leftJoinAndSelect('message.recipients', 'recipients')
      .leftJoinAndSelect('recipients.contact', 'contact');

    if (status) {
      queryBuilder.where('message.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('message.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('message.createdAt <= :endDate', { endDate });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('message.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id },
      relations: ['sentBy', 'recipients', 'recipients.contact'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async create(createDto: CreateMessageDto, sentBy: User): Promise<Message> {
    // Validate recipient exists
    let contacts: Contact[] = [];

    if (createDto.recipientType === RecipientType.CONTACT) {
      const contact = await this.contactRepo.findOne({
        where: { id: createDto.recipientId },
      });
      if (!contact) {
        throw new NotFoundException(`Contact with ID ${createDto.recipientId} not found`);
      }
      contacts = [contact];
    } else if (createDto.recipientType === RecipientType.GROUP) {
      const group = await this.groupRepo.findOne({
        where: { id: createDto.recipientId },
        relations: ['contacts'],
      });
      if (!group) {
        throw new NotFoundException(`Group with ID ${createDto.recipientId} not found`);
      }
      if (!group.contacts || group.contacts.length === 0) {
        throw new BadRequestException(`Group has no contacts`);
      }
      contacts = group.contacts;
    }

    // Determine status
    const scheduledAt = createDto.scheduledAt ? new Date(createDto.scheduledAt) : null;
    const status = scheduledAt && scheduledAt > new Date()
      ? MessageStatus.SCHEDULED
      : MessageStatus.PENDING;

    // Create message
    const message = this.messageRepo.create({
      title: createDto.title,
      body: createDto.body,
      recipientType: createDto.recipientType,
      recipientId: createDto.recipientId,
      scheduledAt: scheduledAt || undefined,
      status,
      sentBy,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Create recipients
    const recipients = contacts.map(contact => {
      const recipientData: any = {
        message: savedMessage,
        contact: contact,
        phone: contact.phone,
        status: RecipientStatus.PENDING,
      };
      return this.recipientRepo.create(recipientData);
    });

    for (const recipient of recipients) {
      await this.recipientRepo.save(recipient);
    }

    // If not scheduled, send immediately
    if (status === MessageStatus.PENDING) {
      // Send in background (don't wait)
      this.sendMessage(savedMessage.id).catch(error => {
        this.logger.error(`Failed to send message ${savedMessage.id}: ${error.message}`);
      });
    }

    return await this.findOne(savedMessage.id);
  }

  async update(id: number, updateDto: UpdateMessageDto): Promise<Message> {
    const message = await this.findOne(id);

    if (message.status === MessageStatus.SENT) {
      throw new BadRequestException('Cannot update a message that has already been sent');
    }

    if (message.status === MessageStatus.SCHEDULED && updateDto.scheduledAt) {
      const newScheduledAt = new Date(updateDto.scheduledAt);
      if (newScheduledAt <= new Date()) {
        // If new scheduled time is in the past, change to PENDING and send
        message.status = MessageStatus.PENDING;
        message.scheduledAt = undefined as any;
      } else {
        message.scheduledAt = newScheduledAt;
      }
    }

    Object.assign(message, updateDto);
    return await this.messageRepo.save(message);
  }

  async remove(id: number): Promise<void> {
    const message = await this.findOne(id);

    if (message.status === MessageStatus.SENT) {
      throw new BadRequestException('Cannot delete a message that has already been sent');
    }

    await this.messageRepo.remove(message);
  }

  async sendMessage(messageId: number): Promise<Message> {
    const message = await this.findOne(messageId);

    if (message.status === MessageStatus.SENT) {
      return message;
    }

    if (message.status === MessageStatus.SCHEDULED) {
      const now = new Date();
      if (message.scheduledAt && message.scheduledAt > now) {
        throw new BadRequestException('Message is scheduled for a future time');
      }
    }

    try {
      message.status = MessageStatus.PENDING;
      await this.messageRepo.save(message);

      const recipients = message.recipients || [];
      let successCount = 0;
      let failCount = 0;

      // Send SMS to each recipient
      for (const recipient of recipients) {
        if (recipient.status === RecipientStatus.SENT) {
          successCount++;
          continue;
        }

        try {
          const smsResponse: SmsResponse = await this.smsProviderService.sendSms(
            recipient.phone,
            message.body,
          );

          if (smsResponse.success) {
            recipient.status = RecipientStatus.SENT;
            recipient.smsProviderId = smsResponse.messageId || null;
            recipient.smsProviderResponse = smsResponse.rawResponse;
            recipient.sentAt = new Date();
            successCount++;
          } else {
            recipient.status = RecipientStatus.FAILED;
            recipient.errorMessage = smsResponse.error || 'Failed to send SMS';
            recipient.smsProviderResponse = smsResponse.rawResponse;
            failCount++;
          }
        } catch (error) {
          this.logger.error(`Failed to send SMS to ${recipient.phone}: ${error.message}`);
          recipient.status = RecipientStatus.FAILED;
          recipient.errorMessage = error.message;
          failCount++;
        }

        await this.recipientRepo.save(recipient);
      }

      // Update message status
      if (failCount === 0) {
        message.status = MessageStatus.SENT;
      } else if (successCount > 0) {
        message.status = MessageStatus.SENT; // Partially sent, but mark as sent
      } else {
        message.status = MessageStatus.FAILED;
      }

      message.sentAt = new Date();
      message.smsProviderResponse = {
        successCount,
        failCount,
        total: recipients.length,
      };

      return await this.messageRepo.save(message);
    } catch (error) {
      this.logger.error(`Failed to send message ${messageId}: ${error.message}`);
      message.status = MessageStatus.FAILED;
      await this.messageRepo.save(message);
      throw error;
    }
  }

  async resendMessage(messageId: number): Promise<Message> {
    const message = await this.findOne(messageId);

    if (message.status !== MessageStatus.FAILED) {
      throw new BadRequestException('Can only resend failed messages');
    }

    // Reset failed recipients to PENDING
    const failedRecipients = message.recipients.filter(
      r => r.status === RecipientStatus.FAILED,
    );

    for (const recipient of failedRecipients) {
      recipient.status = RecipientStatus.PENDING;
      recipient.errorMessage = null;
      await this.recipientRepo.save(recipient);
    }

    return await this.sendMessage(messageId);
  }

  async getRecipients(messageId: number): Promise<MessageRecipient[]> {
    const message = await this.findOne(messageId);
    return message.recipients || [];
  }
}

