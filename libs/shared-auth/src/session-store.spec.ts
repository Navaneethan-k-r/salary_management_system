import { describe, it, expect, beforeEach } from 'vitest';
import { generateOpaqueToken, REDIS_SESSION_KEY_PREFIX } from './index.js';
import { RedisSessionStore } from './session-store.js';
import { UserSession } from '@salary-mgmt/shared-types';

describe('Auth Library', () => {
  describe('generateOpaqueToken', () => {
    it('should generate a token of specified length', () => {
      const token = generateOpaqueToken(10);
      expect(token.length).toBe(10);
    });

    it('should generate unique tokens', () => {
      const token1 = generateOpaqueToken(10);
      const token2 = generateOpaqueToken(10);
      expect(token1).not.toBe(token2);
    });
  });

  describe('RedisSessionStore (in-memory fallback)', () => {
    let store: RedisSessionStore;
    let mockSession: UserSession;

    beforeEach(() => {
      store = new RedisSessionStore();
      mockSession = {
        token: 'test-token',
        userId: 'user-123',
        role: 'hr_admin',
        email: 'test@example.com',
        organizationId: 'org-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
    });

    it('should store and retrieve a session', async () => {
      await store.setSession('test-token', mockSession);
      const retrieved = await store.getSession('test-token');
      expect(retrieved).toEqual(mockSession);
    });

    it('should return null for non-existent session', async () => {
      const retrieved = await store.getSession('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should delete a session', async () => {
      await store.setSession('test-token', mockSession);
      await store.deleteSession('test-token');
      const retrieved = await store.getSession('test-token');
      expect(retrieved).toBeNull();
    });

    it('should handle expired sessions (mocking time)', async () => {
      await store.setSession('test-token', mockSession, -1); // Expire immediately
      const retrieved = await store.getSession('test-token');
      expect(retrieved).toBeNull();
    });
  });
});
