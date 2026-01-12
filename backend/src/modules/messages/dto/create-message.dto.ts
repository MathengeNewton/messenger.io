import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { RecipientType } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message title', example: 'Meeting Reminder' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Message body', example: 'Don\'t forget about the meeting tomorrow at 2 PM' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ description: 'Recipient type', enum: RecipientType })
  @IsEnum(RecipientType)
  @IsNotEmpty()
  recipientType: RecipientType;

  @ApiProperty({ description: 'Recipient ID (Contact ID or Group ID)' })
  @IsNumber()
  @IsNotEmpty()
  recipientId: number;

  @ApiProperty({ description: 'Scheduled send time (ISO string). If null, send immediately', required: false })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

