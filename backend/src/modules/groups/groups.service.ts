import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddContactsDto } from './dto/add-contacts.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async findAll(): Promise<Group[]> {
    return await this.groupRepo.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['createdBy', 'contacts'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async create(createDto: CreateGroupDto, createdBy: User): Promise<Group> {
    // Check if group name already exists
    const existing = await this.groupRepo.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new BadRequestException(`Group with name "${createDto.name}" already exists`);
    }

    const group = this.groupRepo.create({
      ...createDto,
      createdBy,
    });

    return await this.groupRepo.save(group);
  }

  async update(id: number, updateDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    // If name is being updated, check for duplicates
    if (updateDto.name && updateDto.name !== group.name) {
      const existing = await this.groupRepo.findOne({
        where: { name: updateDto.name },
      });

      if (existing) {
        throw new BadRequestException(`Group with name "${updateDto.name}" already exists`);
      }
    }

    Object.assign(group, updateDto);
    return await this.groupRepo.save(group);
  }

  async remove(id: number): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepo.remove(group);
  }

  async addContacts(id: number, addContactsDto: AddContactsDto): Promise<Group> {
    const group = await this.findOne(id);
    const contacts = await this.contactRepo.findBy({
      id: In(addContactsDto.contactIds),
    });

    if (contacts.length !== addContactsDto.contactIds.length) {
      throw new BadRequestException('One or more contact IDs are invalid');
    }

    // Merge with existing contacts (avoid duplicates)
    const existingContactIds = group.contacts?.map(c => c.id) || [];
    const newContacts = contacts.filter(c => !existingContactIds.includes(c.id));
    
    group.contacts = [...(group.contacts || []), ...newContacts];
    return await this.groupRepo.save(group);
  }

  async removeContact(id: number, contactId: number): Promise<Group> {
    const group = await this.findOne(id);
    
    if (!group.contacts) {
      throw new BadRequestException('Group has no contacts');
    }

    group.contacts = group.contacts.filter(c => c.id !== contactId);
    return await this.groupRepo.save(group);
  }

  async getContactCount(id: number): Promise<number> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['contacts'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group.contacts?.length || 0;
  }
}

