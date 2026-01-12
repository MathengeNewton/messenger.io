import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum SmsProviderType {
  AFRICASTALKING = 'AFRICASTALKING',
  TWILIO = 'TWILIO',
  BULKSMS = 'BULKSMS',
  CUSTOM = 'CUSTOM',
}

@Entity('sms_provider_config')
export class SmsProviderConfig {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'SMS Provider type', enum: SmsProviderType })
  @Column({
    type: 'enum',
    enum: SmsProviderType,
    default: SmsProviderType.CUSTOM,
  })
  provider: SmsProviderType;

  @ApiProperty({ description: 'API Key' })
  @Column({ type: 'text' })
  apiKey: string;

  @ApiProperty({ description: 'API Secret (optional)', required: false })
  @Column({ type: 'text', nullable: true })
  apiSecret: string;

  @ApiProperty({ description: 'API URL endpoint', required: false })
  @Column({ nullable: true })
  apiUrl: string;

  @ApiProperty({ description: 'Sender ID' })
  @Column()
  senderId: string;

  @ApiProperty({ description: 'Is provider active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Cached SMS balance', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance: number;

  @ApiProperty({ description: 'Last balance check timestamp', required: false })
  @Column({ nullable: true })
  balanceLastChecked: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


