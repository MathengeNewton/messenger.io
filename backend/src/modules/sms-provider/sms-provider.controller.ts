import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SmsProviderService } from './sms-provider.service';
import { CreateSmsConfigDto, UpdateSmsConfigDto, SendTestSmsDto } from './dto/sms-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';

@ApiTags('SMS Provider')
@Controller('sms-provider')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class SmsProviderController {
  constructor(private readonly smsProviderService: SmsProviderService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get SMS provider configuration' })
  async getConfig() {
    const config = await this.smsProviderService.getConfig();
    if (!config) {
      return { message: 'SMS provider not configured', config: null };
    }
    // Don't expose sensitive data in response
    const { apiKey, apiSecret, ...safeConfig } = config;
    return {
      ...safeConfig,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    };
  }

  @Post('config')
  @ApiOperation({ summary: 'Create or update SMS provider configuration' })
  async createOrUpdateConfig(@Body() createDto: CreateSmsConfigDto) {
    const config = await this.smsProviderService.createOrUpdateConfig(createDto);
    const { apiKey, apiSecret, ...safeConfig } = config;
    return {
      ...safeConfig,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    };
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update SMS provider configuration' })
  async updateConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSmsConfigDto,
  ) {
    const config = await this.smsProviderService.updateConfig(id, updateDto);
    const { apiKey, apiSecret, ...safeConfig } = config;
    return {
      ...safeConfig,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get SMS balance' })
  async getBalance() {
    const balance = await this.smsProviderService.getBalance();
    return { balance };
  }

  @Post('balance/refresh')
  @ApiOperation({ summary: 'Refresh SMS balance from provider' })
  async refreshBalance() {
    const balance = await this.smsProviderService.refreshBalance();
    return { balance };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test SMS' })
  async testSms(@Body() testDto: SendTestSmsDto) {
    return await this.smsProviderService.testSms(testDto);
  }
}

