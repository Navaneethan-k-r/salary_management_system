import { UserSession } from '@salary-mgmt/shared-types';

export const AUTH_HEADER_NAME = 'authorization';
export const BEARER_PREFIX = 'Bearer ';
export const REDIS_SESSION_KEY_PREFIX = 'session:';

export interface AuthContext {
  token: string;
  session?: UserSession;
}

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

export interface SessionStore {
  getSession(token: string): Promise<UserSession | null>;
  setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
  deleteSession(token: string): Promise<void>;
}

export function generateOpaqueToken(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  // Use crypto for secure random bytes if available (in node environment)
  if (typeof process !== 'undefined' && typeof require !== 'undefined') {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      token += chars[randomBytes[i] % chars.length];
    }
  } else {
    // Fallback for non-node environments
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

export * from './session-store.js';
