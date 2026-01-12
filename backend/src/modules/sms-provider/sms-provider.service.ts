import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SmsProviderConfig, SmsProviderType } from './entities/sms-provider-config.entity';
import { CreateSmsConfigDto, UpdateSmsConfigDto, SendTestSmsDto } from './dto/sms-config.dto';

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  balance?: number;
  rawResponse?: any;
}

@Injectable()
export class SmsProviderService {
  private readonly logger = new Logger(SmsProviderService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(SmsProviderConfig)
    private readonly configRepo: Repository<SmsProviderConfig>,
    private readonly configService: ConfigService,
  ) {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
    });
  }

  async getConfig(): Promise<SmsProviderConfig | null> {
    return await this.configRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createOrUpdateConfig(createDto: CreateSmsConfigDto): Promise<SmsProviderConfig> {
    const existing = await this.getConfig();
    
    if (existing) {
      Object.assign(existing, createDto);
      return await this.configRepo.save(existing);
    }

    const config = this.configRepo.create(createDto);
    return await this.configRepo.save(config);
  }

  async updateConfig(id: number, updateDto: UpdateSmsConfigDto): Promise<SmsProviderConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`SMS provider config with ID ${id} not found`);
    }

    Object.assign(config, updateDto);
    return await this.configRepo.save(config);
  }

  async sendSms(phone: string, message: string): Promise<SmsResponse> {
    const config = await this.getConfig();
    
    if (!config || !config.isActive) {
      throw new BadRequestException('SMS provider is not configured or inactive');
    }

    try {
      this.logger.log(`Sending SMS to ${phone} via ${config.provider}`);

      let response: SmsResponse;

      switch (config.provider) {
        case SmsProviderType.AFRICASTALKING:
          response = await this.sendViaAfricasTalking(phone, message, config);
          break;
        case SmsProviderType.TWILIO:
          response = await this.sendViaTwilio(phone, message, config);
          break;
        case SmsProviderType.BULKSMS:
          response = await this.sendViaBulkSms(phone, message, config);
          break;
        case SmsProviderType.CUSTOM:
        default:
          response = await this.sendViaCustom(phone, message, config);
          break;
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
        rawResponse: error.response?.data || error.message,
      };
    }
  }

  private async sendViaAfricasTalking(
    phone: string,
    message: string,
    config: SmsProviderConfig,
  ): Promise<SmsResponse> {
    const url = config.apiUrl || 'https://api.africastalking.com/version1/messaging';
    
    const response = await this.axiosInstance.post(
      url,
      {
        username: config.apiKey,
        to: phone,
        message: message,
        from: config.senderId,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': config.apiSecret || config.apiKey,
        },
      },
    );

    return {
      success: true,
      messageId: response.data?.SMSMessageData?.Recipients?.[0]?.messageId,
      status: response.data?.SMSMessageData?.Recipients?.[0]?.status,
      rawResponse: response.data,
    };
  }

  private async sendViaTwilio(
    phone: string,
    message: string,
    config: SmsProviderConfig,
  ): Promise<SmsResponse> {
    const accountSid = config.apiKey;
    const authToken = config.apiSecret;
    const url = config.apiUrl || `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await this.axiosInstance.post(
      url,
      new URLSearchParams({
        To: phone,
        From: config.senderId,
        Body: message,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: accountSid,
          password: authToken,
        },
      },
    );

    return {
      success: true,
      messageId: response.data?.sid,
      status: response.data?.status,
      rawResponse: response.data,
    };
  }

  private async sendViaBulkSms(
    phone: string,
    message: string,
    config: SmsProviderConfig,
  ): Promise<SmsResponse> {
    const url = config.apiUrl || 'https://api.bulksms.com/v1/messages';
    
    const response = await this.axiosInstance.post(
      url,
      {
        to: phone,
        body: message,
        from: config.senderId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      },
    );

    return {
      success: true,
      messageId: response.data?.id,
      status: response.data?.status,
      rawResponse: response.data,
    };
  }

  private async sendViaCustom(
    phone: string,
    message: string,
    config: SmsProviderConfig,
  ): Promise<SmsResponse> {
    if (!config.apiUrl) {
      throw new BadRequestException('API URL is required for custom SMS provider');
    }

    // Generic HTTP POST request
    // Assumes the API accepts: { phone, message, senderId } or similar
    const payload = {
      phone: phone,
      message: message,
      senderId: config.senderId,
      // Add other common fields
      to: phone,
      text: message,
      from: config.senderId,
    };

    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Add authentication
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-API-Key'] = config.apiKey;
    }

    if (config.apiSecret) {
      headers['X-API-Secret'] = config.apiSecret;
    }

    const response = await this.axiosInstance.post(config.apiUrl, payload, { headers });

    return {
      success: true,
      messageId: response.data?.messageId || response.data?.id || response.data?.sid,
      status: response.data?.status || 'sent',
      rawResponse: response.data,
    };
  }

  async getBalance(): Promise<number> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('SMS provider is not configured');
    }

    // Check if balance was recently checked (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (config.balanceLastChecked && config.balanceLastChecked > oneHourAgo && config.balance !== null) {
      return config.balance;
    }

    // Try to fetch balance from provider (if supported)
    // For now, return cached balance or 0
    // This can be extended to call provider's balance API
    return config.balance || 0;
  }

  async refreshBalance(): Promise<number> {
    const config = await this.getConfig();
    
    if (!config) {
      throw new NotFoundException('SMS provider is not configured');
    }

    // This would call the provider's balance API
    // For now, we'll just update the timestamp
    config.balanceLastChecked = new Date();
    await this.configRepo.save(config);

    return config.balance || 0;
  }

  async testSms(testDto: SendTestSmsDto): Promise<SmsResponse> {
    return await this.sendSms(testDto.phone, testDto.message);
  }
}

