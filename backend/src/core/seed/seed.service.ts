import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/roles/entities/role.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    // Only seed ADMIN role for messenger platform
    const adminRole = UserRole.ADMIN;
    const exists = await this.roleRepo.findOne({ where: { name: adminRole } });
    if (!exists) {
      await this.roleRepo.save(this.roleRepo.create({ name: adminRole }));
      this.logger.log(`Seeded role: ${adminRole}`);
    }
  }

  private async seedAdminUser() {
    const adminExists = await this.userRepo.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      const adminRole = await this.roleRepo.findOne({
        where: { name: UserRole.ADMIN },
      });
      if (!adminRole) {
        throw new Error('Admin role not found! Did you seed roles first?');
      }
      
      const user = this.userRepo.create({
        username: 'admin',
        email: 'admin@messenger.io',
        password: await bcrypt.hash('admin123', 10),
        roles: [adminRole],
      });
      await this.userRepo.save(user);
      this.logger.log('Seeded admin user');
    }
  }
}
