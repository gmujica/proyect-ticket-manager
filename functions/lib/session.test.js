// @vitest-environment node
//
// Node rather than the project-wide jsdom: these helpers use crypto.subtle,
// which the Workers runtime provides and jsdom does not.

import {
  clearedCookie,
  constantTimeEqual,
  createToken,
  hashToken,
  isExpired,
  SESSION_COOKIE,
  sessionCookie,
  SESSION_TTL_SECONDS,
  stateCookie,
  STATE_COOKIE,
  STATE_TTL_SECONDS
} from './session';

describe('createToken', () => {
  it('is url safe', () => {
    // it travels in a cookie and in a query string, so + / = would need escaping
    expect(createToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('carries 32 bytes of entropy', () => {
    // 32 bytes in unpadded base64url
    expect(createToken()).toHaveLength(43);
  });

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 200 }, createToken));

    expect(tokens.size).toBe(200);
  });
});

describe('hashToken', () => {
  it('returns a hex sha-256 digest', async () => {
    expect(await hashToken('token')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches the known digest for a known input', async () => {
    expect(await hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('is stable for the same token', async () => {
    expect(await hashToken('same')).toBe(await hashToken('same'));
  });

  it('differs for different tokens', async () => {
    expect(await hashToken('a')).not.toBe(await hashToken('b'));
  });

  it('never returns the token itself', async () => {
    const token = createToken();

    expect(await hashToken(token)).not.toBe(token);
  });
});

describe('constantTimeEqual', () => {
  it('accepts identical strings', () => {
    expect(constantTimeEqual('abc123', 'abc123')).toBe(true);
  });

  it('rejects a difference in the last character', () => {
    expect(constantTimeEqual('abc123', 'abc124')).toBe(false);
  });

  it('rejects a difference in the first character', () => {
    expect(constantTimeEqual('abc123', 'zbc123')).toBe(false);
  });

  it('rejects different lengths', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('rejects anything that is not a string', () => {
    expect(constantTimeEqual(undefined, 'abc')).toBe(false);
    expect(constantTimeEqual('abc', undefined)).toBe(false);
    expect(constantTimeEqual(null, null)).toBe(false);
    expect(constantTimeEqual(123, 123)).toBe(false);
  });

  it('treats two empty strings as equal', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });
});

describe('isExpired', () => {
  it('is false before the expiry', () => {
    expect(isExpired(1_000, 999)).toBe(false);
  });

  it('is true exactly at the expiry', () => {
    expect(isExpired(1_000, 1_000)).toBe(true);
  });

  it('is true after the expiry', () => {
    expect(isExpired(1_000, 1_001)).toBe(true);
  });

  // A row without a usable expiry has to read as expired: the alternative is a
  // session that never dies because its timestamp was corrupt.
  it('treats a missing or non-numeric expiry as expired', () => {
    expect(isExpired(undefined, 0)).toBe(true);
    expect(isExpired(null, 0)).toBe(true);
    expect(isExpired('1000', 0)).toBe(true);
  });
});

describe('cookies', () => {
  it('marks the session cookie HttpOnly, Secure and SameSite=Lax', () => {
    const cookie = sessionCookie('the-token');

    expect(cookie).toContain(`${SESSION_COOKIE}=the-token`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain(`Max-Age=${SESSION_TTL_SECONDS}`);
  });

  it('gives the state cookie the shorter life', () => {
    expect(stateCookie('s')).toContain(`Max-Age=${STATE_TTL_SECONDS}`);
    expect(STATE_TTL_SECONDS).toBeLessThan(SESSION_TTL_SECONDS);
  });

  it('expires a cleared cookie immediately', () => {
    const cookie = clearedCookie(SESSION_COOKIE);

    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toContain('Max-Age=0');
  });

  it('clears whichever cookie it is given', () => {
    expect(clearedCookie(STATE_COOKIE)).toContain(`${STATE_COOKIE}=`);
  });
});
