import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrAdmin } from '../database/hr-admin.entity';
import { RedisSessionStore, generateOpaqueToken } from '@salary-mgmt/shared-auth';
import { UserSession } from '@salary-mgmt/shared-types';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private sessionStore!: RedisSessionStore;
  private redisClient!: Redis;

  constructor(
    @InjectRepository(HrAdmin)
    private readonly adminRepository: Repository<HrAdmin>,
  ) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.redisClient.on('error', (err) => {
      this.logger.warn(`Redis connection error, falling back to in-memory session store: ${err.message}`);
    });

    // Asynchronously connect without blocking Node event loop startup
    this.redisClient.connect().catch((err) => {
      this.logger.warn(`Redis initial connect failed: ${err.message}. Running with in-memory session store.`);
    });

    this.sessionStore = new RedisSessionStore(this.redisClient);
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (err) {
        this.logger.error('Error disconnecting Redis client', err);
      }
    }
  }

  async validateUser(
    email: string,
    passwordPlain: string
  ): Promise<{ token: string; user: { id: string; email: string; fullName: string; role: 'hr_admin' } } | null> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (!admin) {
      return null;
    }

    // Support both bcrypt hashes and plain text (e.g. initial dev seeds) safely
    const isBcrypt = admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2a$');
    const isPasswordValid = isBcrypt
      ? await bcrypt.compare(passwordPlain, admin.password_hash)
      : admin.password_hash === passwordPlain;

    if (!isPasswordValid) {
      return null;
    }

    const token = generateOpaqueToken(32);
    const ttlSeconds = parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10);

    const session: UserSession = {
      token,
      userId: admin.id,
      role: 'hr_admin',
      email: admin.email,
      organizationId: 'default-org',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    await this.sessionStore.setSession(token, session, ttlSeconds);

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: 'HR Admin',
        role: 'hr_admin',
      },
    };
  }
}
