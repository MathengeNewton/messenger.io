import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AddContactsDto {
  @ApiProperty({ description: 'Array of contact IDs to add to the group', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  contactIds: number[];
}


