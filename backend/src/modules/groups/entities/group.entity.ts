import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('group')
export class Group {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Group name', example: 'Marketing Team' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Group description', example: 'Marketing department contacts', required: false })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiProperty({ description: 'User who created the group' })
  @ManyToOne(() => User, { eager: true })
  createdBy: User;

  @ApiProperty({ description: 'Contacts in this group' })
  @ManyToMany(() => Contact, (contact) => contact.groups, { eager: false })
  @JoinTable({
    name: 'group_contact',
    joinColumn: { name: 'groupId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'contactId', referencedColumnName: 'id' },
  })
  contacts: Contact[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}


