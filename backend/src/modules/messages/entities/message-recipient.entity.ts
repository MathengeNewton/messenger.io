import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RecipientStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
}

@Entity('message_recipient')
export class MessageRecipient {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Parent message' })
  @ManyToOne(() => Message, (message) => message.recipients, { onDelete: 'CASCADE' })
  message: Message;

  @ApiProperty({ description: 'Contact who received the message' })
  @ManyToOne(() => Contact, { eager: true })
  contact: Contact;

  @ApiProperty({ description: 'Phone number at time of send' })
  @Column()
  phone: string;

  @ApiProperty({ description: 'Recipient status', enum: RecipientStatus })
  @Column({
    type: 'enum',
    enum: RecipientStatus,
    default: RecipientStatus.PENDING,
  })
  status: RecipientStatus;

  @ApiProperty({ description: 'SMS provider message ID', required: false })
  @Column({ type: 'varchar', nullable: true })
  smsProviderId: string | null;

  @ApiProperty({ description: 'SMS provider response', required: false })
  @Column({ type: 'json', nullable: true })
  smsProviderResponse: any;

  @ApiProperty({ description: 'Send timestamp', required: false })
  @Column({ nullable: true })
  sentAt: Date;

  @ApiProperty({ description: 'Delivery timestamp', required: false })
  @Column({ nullable: true })
  deliveredAt: Date;

  @ApiProperty({ description: 'Error message if failed', required: false })
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}

