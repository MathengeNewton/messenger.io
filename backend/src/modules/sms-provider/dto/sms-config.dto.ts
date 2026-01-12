import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { SmsProviderType } from '../entities/sms-provider-config.entity';

export class CreateSmsConfigDto {
  @ApiProperty({ description: 'SMS Provider type', enum: SmsProviderType })
  @IsEnum(SmsProviderType)
  @IsNotEmpty()
  provider: SmsProviderType;

  @ApiProperty({ description: 'API Key' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ description: 'API Secret', required: false })
  @IsString()
  @IsOptional()
  apiSecret?: string;

  @ApiProperty({ description: 'API URL endpoint', required: false })
  @IsString()
  @IsOptional()
  apiUrl?: string;

  @ApiProperty({ description: 'Sender ID' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ description: 'Is provider active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSmsConfigDto {
  @ApiProperty({ description: 'SMS Provider type', enum: SmsProviderType, required: false })
  @IsEnum(SmsProviderType)
  @IsOptional()
  provider?: SmsProviderType;

  @ApiProperty({ description: 'API Key', required: false })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: 'API Secret', required: false })
  @IsString()
  @IsOptional()
  apiSecret?: string;

  @ApiProperty({ description: 'API URL endpoint', required: false })
  @IsString()
  @IsOptional()
  apiUrl?: string;

  @ApiProperty({ description: 'Sender ID', required: false })
  @IsString()
  @IsOptional()
  senderId?: string;

  @ApiProperty({ description: 'Is provider active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SendTestSmsDto {
  @ApiProperty({ description: 'Phone number to send test SMS to', example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Test message', example: 'This is a test message' })
  @IsString()
  @IsNotEmpty()
  message: string;
}


