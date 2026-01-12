import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { BulkCreateContactsDto } from './dto/bulk-create-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contacts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.contactsService.findAll(pageNum, limitNum, search);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search contacts' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query('q') query: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.contactsService.search(query, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.contactsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  async create(@Body() createDto: CreateContactDto) {
    return await this.contactsService.create(createDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create contacts' })
  async bulkCreate(@Body() bulkDto: BulkCreateContactsDto) {
    return await this.contactsService.bulkCreate(bulkDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateContactDto,
  ) {
    return await this.contactsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactsService.remove(id);
    return { message: 'Contact deleted successfully' };
  }
}


