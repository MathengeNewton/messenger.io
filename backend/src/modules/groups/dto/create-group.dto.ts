import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name', example: 'Marketing Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Group description', example: 'Marketing department contacts', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

