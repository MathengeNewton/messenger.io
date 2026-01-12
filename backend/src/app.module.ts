import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './core/config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/roles/entities/role.entity';
import { Contact } from './modules/contacts/entities/contact.entity';
import { Group } from './modules/groups/entities/group.entity';
import { SmsProviderConfig } from './modules/sms-provider/entities/sms-provider-config.entity';
import { Message } from './modules/messages/entities/message.entity';
import { MessageRecipient } from './modules/messages/entities/message-recipient.entity';
import { SeedService } from './core/seed/seed.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MessagesModule } from './modules/messages/messages.module';
import { SmsProviderModule } from './modules/sms-provider/sms-provider.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import AppConfig from './core/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, AppConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return configService.get<TypeOrmModuleOptions>('database')!;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      Contact,
      Group,
      SmsProviderConfig,
      Message,
      MessageRecipient,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('app');
        console.log('JWT Config:', {
          hasSecret: !!config?.jwt?.secret,
          expiresIn: config?.jwt?.expiresIn,
        });
        return {
          secret: config?.jwt?.secret || 'fallback_secret_key',
          signOptions: {
            expiresIn: config?.jwt?.expiresIn || '1d',
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    ContactsModule,
    GroupsModule,
    MessagesModule,
    SmsProviderModule,
    DashboardModule,
    UploadsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    const appConfig = this.configService.get('app');
    console.log('App Config:', {
      hasJwtConfig: !!appConfig?.jwt,
      hasSecret: !!appConfig?.jwt?.secret,
    });
  }
}
