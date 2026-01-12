import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Group } from '../../groups/entities/group.entity';
import { MessageRecipient } from './message-recipient.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}

export enum RecipientType {
  CONTACT = 'CONTACT',
  GROUP = 'GROUP',
}

@Entity('message')
export class Message {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Message title', example: 'Meeting Reminder' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Message body', example: 'Don\'t forget about the meeting tomorrow' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Message status', enum: MessageStatus })
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @ApiProperty({ description: 'Scheduled send time', required: false })
  @Column({ nullable: true })
  scheduledAt: Date;

  @ApiProperty({ description: 'Actual send time', required: false })
  @Column({ nullable: true })
  sentAt: Date;

  @ApiProperty({ description: 'Recipient type', enum: RecipientType })
  @Column({
    type: 'enum',
    enum: RecipientType,
  })
  recipientType: RecipientType;

  @ApiProperty({ description: 'Recipient ID (Contact or Group ID)' })
  @Column()
  recipientId: number;

  @ApiProperty({ description: 'User who sent the message' })
  @ManyToOne(() => User, { eager: true })
  sentBy: User;

  @ApiProperty({ description: 'SMS provider message ID', required: false })
  @Column({ nullable: true })
  smsProviderId: string;

  @ApiProperty({ description: 'SMS provider response', required: false })
  @Column({ type: 'json', nullable: true })
  smsProviderResponse: any;

  @ApiProperty({ description: 'Message recipients (individual SMS sends)' })
  @OneToMany(() => MessageRecipient, (recipient) => recipient.message, { cascade: true })
  recipients: MessageRecipient[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}


