import type { UserSession } from '@salary-mgmt/shared-types';

export const AUTH_HEADER_NAME = 'authorization';
export const BEARER_PREFIX = 'Bearer ';
export const REDIS_SESSION_KEY_PREFIX = 'session:';

export interface AuthContext {
  token: string;
  session?: UserSession;
}

/**
 * Extracts a Bearer token from an Authorization header value.
 * Handles case-insensitivity and extra whitespace.
 */
export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return null;
  }
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

/**
 * Generates a cryptographically secure random alphanumeric string token.
 * Uses Web Crypto API when available (Node 15+ & browser), falling back to Math.random.
 */
export function generateOpaqueToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      token += chars[bytes[i] % chars.length];
    }
    return token;
  }

  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

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
