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
