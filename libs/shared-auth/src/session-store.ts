import { UserSession } from '@salary-mgmt/shared-types';
import { SessionStore, REDIS_SESSION_KEY_PREFIX } from './index';

// A simple in-memory fallback store
class InMemorySessionStore implements SessionStore {
  private store: Map<string, { session: UserSession; expiresAt: number }> = new Map();

  async getSession(token: string): Promise<UserSession | null> {
    const data = this.store.get(token);
    if (!data) return null;
    
    if (Date.now() > data.expiresAt) {
      this.store.delete(token);
      return null;
    }
    
    return data.session;
  }

  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
    this.store.set(token, {
      session,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  async deleteSession(token: string): Promise<void> {
    this.store.delete(token);
  }
}

export class RedisSessionStore implements SessionStore {
  private fallbackStore = new InMemorySessionStore();
  
  constructor(private redisClient?: any) {} // Assuming ioredis or redis client

  private getKey(token: string): string {
    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
  }

  async getSession(token: string): Promise<UserSession | null> {
    if (!this.redisClient) {
      return this.fallbackStore.getSession(token);
    }
    
    try {
      const data = await this.redisClient.get(this.getKey(token));
      if (!data) return null;
      return JSON.parse(data) as UserSession;
    } catch (error) {
      console.warn('Redis error, falling back to in-memory', error);
      return this.fallbackStore.getSession(token);
    }
  }

  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
    if (!this.redisClient) {
      return this.fallbackStore.setSession(token, session, ttlSeconds);
    }
    
    try {
      await this.redisClient.set(
        this.getKey(token),
        JSON.stringify(session),
        'EX',
        ttlSeconds
      );
    } catch (error) {
      console.warn('Redis error, falling back to in-memory', error);
      return this.fallbackStore.setSession(token, session, ttlSeconds);
    }
  }

  async deleteSession(token: string): Promise<void> {
    if (!this.redisClient) {
      return this.fallbackStore.deleteSession(token);
    }
    
    try {
      await this.redisClient.del(this.getKey(token));
    } catch (error) {
      console.warn('Redis error, falling back to in-memory', error);
      return this.fallbackStore.deleteSession(token);
    }
  }
}
