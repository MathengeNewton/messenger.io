import { ApiProperty } from '@nestjs/swagger';

export class ExcelUploadResponseDto {
  @ApiProperty({ description: 'Parsed contacts from Excel file' })
  contacts: Array<{ name: string; phone: string }>;

  @ApiProperty({ description: 'Validation errors', example: [] })
  errors: Array<{ row: number; field: string; message: string }>;

  @ApiProperty({ description: 'Total rows parsed' })
  totalRows: number;

  @ApiProperty({ description: 'Valid rows' })
  validRows: number;
}


