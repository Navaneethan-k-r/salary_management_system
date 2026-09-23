import { describe, it, expect } from 'vitest';
import { extractBearerToken, BEARER_PREFIX, AUTH_HEADER_NAME } from './index';

describe('shared-auth utilities', () => {
  it('extracts token from standard Bearer header', () => {
    const token = extractBearerToken('Bearer sample_token_123');
    expect(token).toBe('sample_token_123');
  });

  it('extracts token case-insensitively', () => {
    const token = extractBearerToken('bearer token_lower');
    expect(token).toBe('token_lower');
  });

  it('handles extraneous whitespace surrounding token', () => {
    const token = extractBearerToken('Bearer    token_padded   ');
    expect(token).toBe('token_padded');
  });

  it('returns null for missing, null, or empty headers', () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
  });

  it('returns null for non-Bearer headers or malformed formats', () => {
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Bearer   ')).toBeNull();
  });

  it('exports expected constants', () => {
    expect(BEARER_PREFIX).toBe('Bearer ');
    expect(AUTH_HEADER_NAME).toBe('authorization');
  });
});
