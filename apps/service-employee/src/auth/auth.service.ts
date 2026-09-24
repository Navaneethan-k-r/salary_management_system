import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrAdmin } from '../database/hr-admin.entity';
import { RedisSessionStore } from '@salary-mgmt/shared-auth';
import { UserSession } from '@salary-mgmt/shared-types';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  private sessionStore: RedisSessionStore;

  constructor(
    @InjectRepository(HrAdmin)
    private readonly adminRepository: Repository<HrAdmin>,
  ) {}

  onModuleInit() {
    // Ideally from config, hardcoded for now
    const redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
    this.sessionStore = new RedisSessionStore(redisClient);
  }

  async validateUser(email: string, passwordHash: string): Promise<string | null> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (!admin) {
      return null;
    }
    
    // In a real app we would use bcrypt, but here we simply compare the seed password for the spec
    if (admin.password_hash !== passwordHash) {
      return null;
    }
    
    const token = crypto.randomBytes(16).toString('hex');
    
    const session: UserSession = {
      token,
      userId: admin.id,
      role: 'hr_admin',
      email: admin.email,
      organizationId: 'default-org',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    
    await this.sessionStore.setSession(token, session);
    
    return token;
  }
}
