import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('contact')
export class Contact {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Contact name', example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '+254712345678' })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({ description: 'Groups this contact belongs to' })
  @ManyToMany(() => Group, (group) => group.contacts)
  groups: Group[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

