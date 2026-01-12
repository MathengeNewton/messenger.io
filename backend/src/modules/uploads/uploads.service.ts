import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as xlsx from 'xlsx';

@Injectable()
export class UploadsService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    // Create uploads directory if it doesn't exist
    this.uploadPath = path.join(process.cwd(), 'uploads', 'wastage');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG and PNG images are allowed');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, uniqueFilename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path for database storage
    return `uploads/wastage/${uniqueFilename}`;
  }

  getFileStream(filename: string): fs.ReadStream {
    const filePath = path.join(process.cwd(), filename);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    return fs.createReadStream(filePath);
  }

  deleteFile(filename: string): void {
    const filePath = path.join(process.cwd(), filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async parseExcelFile(file: Express.Multer.File): Promise<{
    contacts: Array<{ name: string; phone: string }>;
    errors: Array<{ row: number; field: string; message: string }>;
    totalRows: number;
    validRows: number;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // Sometimes Excel files are sent as this
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension) && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
    }

    try {
      // Parse Excel file
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });

      const contacts: Array<{ name: string; phone: string }> = [];
      const errors: Array<{ row: number; field: string; message: string }> = [];
      let totalRows = 0;
      let validRows = 0;

      // Skip header row if present (check if first row contains "Name" or "Phone")
      let startRow = 0;
      if (data.length > 0) {
        const firstRow = data[0] as any[];
        const firstRowStr = firstRow.map(cell => String(cell || '').toLowerCase()).join(' ');
        if (firstRowStr.includes('name') || firstRowStr.includes('phone')) {
          startRow = 1;
        }
      }

      // Process rows
      for (let i = startRow; i < data.length; i++) {
        const row = data[i] as any[];
        totalRows++;

        // Skip empty rows
        if (!row || row.length === 0 || (!row[0] && !row[1])) {
          continue;
        }

        const name = String(row[0] || '').trim();
        const phone = String(row[1] || '').trim();

        // Validate
        if (!name) {
          errors.push({
            row: i + 1,
            field: 'name',
            message: 'Name is required',
          });
          continue;
        }

        if (!phone) {
          errors.push({
            row: i + 1,
            field: 'phone',
            message: 'Phone is required',
          });
          continue;
        }

        // Basic phone validation (remove spaces, dashes, parentheses)
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.length < 9) {
          errors.push({
            row: i + 1,
            field: 'phone',
            message: 'Phone number is too short',
          });
          continue;
        }

        contacts.push({ name, phone: cleanPhone });
        validRows++;
      }

      return {
        contacts,
        errors,
        totalRows,
        validRows,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
    }
  }
}

