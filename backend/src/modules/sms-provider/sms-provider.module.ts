import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsProviderController } from './sms-provider.controller';
import { SmsProviderService } from './sms-provider.service';
import { SmsProviderConfig } from './entities/sms-provider-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmsProviderConfig])],
  controllers: [SmsProviderController],
  providers: [SmsProviderService],
  exports: [SmsProviderService],
})
export class SmsProviderModule {}


