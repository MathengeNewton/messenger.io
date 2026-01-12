import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { Message, MessageStatus } from '../messages/entities/message.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Group } from '../groups/entities/group.entity';
import { SmsProviderService } from '../sms-provider/sms-provider.service';
import { DashboardMetricsDto } from './dto/metrics.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    private readonly smsProviderService: SmsProviderService,
  ) {}

  async getMetrics(): Promise<DashboardMetricsDto> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total SMS sent (count of sent messages)
    const totalSmsSent = await this.messageRepo.count({
      where: { status: MessageStatus.SENT },
    });

    // Total groups
    const totalGroups = await this.groupRepo.count();

    // Total contacts
    const totalContacts = await this.contactRepo.count();

    // SMS balance
    let smsBalance = 0;
    try {
      smsBalance = await this.smsProviderService.getBalance();
    } catch (error) {
      this.logger.warn('Failed to get SMS balance:', error.message);
    }

    // Messages today
    const messagesToday = await this.messageRepo.count({
      where: {
        status: MessageStatus.SENT,
        sentAt: MoreThanOrEqual(startOfToday),
      },
    });

    // Messages this week
    const messagesThisWeek = await this.messageRepo.count({
      where: {
        status: MessageStatus.SENT,
        sentAt: MoreThanOrEqual(startOfWeek),
      },
    });

    // Messages this month
    const messagesThisMonth = await this.messageRepo.count({
      where: {
        status: MessageStatus.SENT,
        sentAt: MoreThanOrEqual(startOfMonth),
      },
    });

    // Failed messages
    const failedMessages = await this.messageRepo.count({
      where: { status: MessageStatus.FAILED },
    });

    return {
      totalSmsSent,
      totalGroups,
      totalContacts,
      smsBalance,
      messagesToday,
      messagesThisWeek,
      messagesThisMonth,
      failedMessages,
      lastUpdated: new Date(),
    };
  }
}

