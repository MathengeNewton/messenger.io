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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageStatus } from './entities/message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: MessageStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: MessageStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.messagesService.findAll(pageNum, limitNum, status, start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.messagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and send a message (instant or scheduled)' })
  async create(@Body() createDto: CreateMessageDto, @Request() req) {
    return await this.messagesService.create(createDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a scheduled message' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMessageDto,
  ) {
    return await this.messagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete a scheduled message' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.messagesService.remove(id);
    return { message: 'Message deleted successfully' };
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend a failed message' })
  async resend(@Param('id', ParseIntPipe) id: number) {
    return await this.messagesService.resendMessage(id);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'Get message recipients with status' })
  async getRecipients(@Param('id', ParseIntPipe) id: number) {
    return await this.messagesService.getRecipients(id);
  }
}


