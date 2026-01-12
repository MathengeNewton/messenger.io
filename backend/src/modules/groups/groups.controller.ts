import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddContactsDto } from './dto/add-contacts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List all groups' })
  async findAll() {
    const groups = await this.groupsService.findAll();
    // Add contact count to each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const count = await this.groupsService.getContactCount(group.id);
        return { ...group, contactCount: count };
      }),
    );
    return groupsWithCounts;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const group = await this.groupsService.findOne(id);
    return { ...group, contactCount: group.contacts?.length || 0 };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  async create(@Body() createDto: CreateGroupDto, @Request() req) {
    return await this.groupsService.create(createDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateGroupDto,
  ) {
    return await this.groupsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.groupsService.remove(id);
    return { message: 'Group deleted successfully' };
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contacts to a group' })
  async addContacts(
    @Param('id', ParseIntPipe) id: number,
    @Body() addContactsDto: AddContactsDto,
  ) {
    return await this.groupsService.addContacts(id, addContactsDto);
  }

  @Delete(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Remove a contact from a group' })
  async removeContact(
    @Param('id', ParseIntPipe) id: number,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    return await this.groupsService.removeContact(id, contactId);
  }
}


