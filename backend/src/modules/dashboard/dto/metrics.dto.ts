import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ description: 'Total SMS sent', example: 1250 })
  totalSmsSent: number;

  @ApiProperty({ description: 'Total groups', example: 12 })
  totalGroups: number;

  @ApiProperty({ description: 'Total contacts', example: 350 })
  totalContacts: number;

  @ApiProperty({ description: 'SMS balance', example: 5000.50 })
  smsBalance: number;

  @ApiProperty({ description: 'Messages sent today', example: 45 })
  messagesToday: number;

  @ApiProperty({ description: 'Messages sent this week', example: 180 })
  messagesThisWeek: number;

  @ApiProperty({ description: 'Messages sent this month', example: 650 })
  messagesThisMonth: number;

  @ApiProperty({ description: 'Failed messages count', example: 5 })
  failedMessages: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}


