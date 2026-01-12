import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Contact])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}

