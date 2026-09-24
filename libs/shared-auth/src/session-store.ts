import { UserSession } from '@salary-mgmt/shared-types';

export const REDIS_SESSION_KEY_PREFIX = 'session:';

export interface SessionStore {
  getSession(token: string): Promise<UserSession | null>;
  setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
  deleteSession(token: string): Promise<void>;
}

// In-memory fallback session store with auto-expiry
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
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async deleteSession(token: string): Promise<void> {
    this.store.delete(token);
  }
}

export class RedisSessionStore implements SessionStore {
  private fallbackStore = new InMemorySessionStore();
  private redisClient?: any;

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
  }

  private getKey(token: string): string {
    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
  }

  async getSession(token: string): Promise<UserSession | null> {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      return this.fallbackStore.getSession(token);
    }

    try {
      const data = await this.redisClient.get(this.getKey(token));
      if (!data) return null;
      return JSON.parse(data) as UserSession;
    } catch (error) {
      console.warn('Redis error, falling back to in-memory session store', error);
      return this.fallbackStore.getSession(token);
    }
  }

  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
    // Keep in-memory store synchronized as fallback
    await this.fallbackStore.setSession(token, session, ttlSeconds);

    if (!this.redisClient || this.redisClient.status !== 'ready') {
      return;
    }

    try {
      await this.redisClient.set(
        this.getKey(token),
        JSON.stringify(session),
        'EX',
        ttlSeconds
      );
    } catch (error) {
      console.warn('Redis error setting session, stored in fallback in-memory store', error);
    }
  }

  async deleteSession(token: string): Promise<void> {
    await this.fallbackStore.deleteSession(token);

    if (!this.redisClient || this.redisClient.status !== 'ready') {
      return;
    }

    try {
      await this.redisClient.del(this.getKey(token));
    } catch (error) {
      console.warn('Redis error deleting session', error);
    }
  }
}
