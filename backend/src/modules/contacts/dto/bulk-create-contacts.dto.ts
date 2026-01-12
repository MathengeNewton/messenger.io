import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContactDto } from './create-contact.dto';

export class BulkCreateContactsDto {
  @ApiProperty({ description: 'Array of contacts to create', type: [CreateContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts: CreateContactDto[];
}


