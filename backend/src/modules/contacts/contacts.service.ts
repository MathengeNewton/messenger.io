import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { BulkCreateContactsDto } from './dto/bulk-create-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async findAll(page: number = 1, limit: number = 50, search?: string): Promise<{ data: Contact[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.contactRepo.createQueryBuilder('contact');

    if (search) {
      queryBuilder.where(
        '(contact.name ILIKE :search OR contact.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('contact.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepo.findOne({
      where: { id },
      relations: ['groups'],
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async create(createDto: CreateContactDto): Promise<Contact> {
    // Check if phone already exists
    const existing = await this.contactRepo.findOne({
      where: { phone: createDto.phone },
    });

    if (existing) {
      throw new BadRequestException(`Contact with phone ${createDto.phone} already exists`);
    }

    const contact = this.contactRepo.create(createDto);
    return await this.contactRepo.save(contact);
  }

  async bulkCreate(bulkDto: BulkCreateContactsDto): Promise<{ created: number; skipped: number; errors: any[] }> {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (let i = 0; i < bulkDto.contacts.length; i++) {
      const contactDto = bulkDto.contacts[i];
      try {
        // Check if phone already exists
        const existing = await this.contactRepo.findOne({
          where: { phone: contactDto.phone },
        });

        if (existing) {
          results.skipped++;
          results.errors.push({
            index: i,
            contact: contactDto,
            error: 'Phone number already exists',
          });
          continue;
        }

        const contact = this.contactRepo.create(contactDto);
        await this.contactRepo.save(contact);
        results.created++;
      } catch (error) {
        results.skipped++;
        results.errors.push({
          index: i,
          contact: contactDto,
          error: error.message || 'Failed to create contact',
        });
      }
    }

    return results;
  }

  async update(id: number, updateDto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    // If phone is being updated, check for duplicates
    if (updateDto.phone && updateDto.phone !== contact.phone) {
      const existing = await this.contactRepo.findOne({
        where: { phone: updateDto.phone },
      });

      if (existing) {
        throw new BadRequestException(`Contact with phone ${updateDto.phone} already exists`);
      }
    }

    Object.assign(contact, updateDto);
    return await this.contactRepo.save(contact);
  }

  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepo.remove(contact);
  }

  async search(query: string, limit: number = 20): Promise<Contact[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return await this.contactRepo.find({
      where: [
        { name: Like(`%${query.trim()}%`) },
        { phone: Like(`%${query.trim()}%`) },
      ],
      take: limit,
      order: {
        name: 'ASC',
      },
    });
  }
}


