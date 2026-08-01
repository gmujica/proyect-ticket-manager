// @vitest-environment node

import { parseCookies, serializeCookie } from './cookies';

describe('parseCookies', () => {
  it('reads a single cookie', () => {
    expect(parseCookies('a=1')).toEqual({ a: '1' });
  });

  it('reads several cookies', () => {
    expect(parseCookies('a=1; b=2; c=3')).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('tolerates missing spaces after the separator', () => {
    expect(parseCookies('a=1;b=2')).toEqual({ a: '1', b: '2' });
  });

  it('decodes percent-encoded values', () => {
    expect(parseCookies('token=a%20b%3Dc')).toEqual({ token: 'a b=c' });
  });

  it('keeps a value that contains an equals sign', () => {
    // base64 padding is the case that matters here
    expect(parseCookies('t=abc==')).toEqual({ t: 'abc==' });
  });

  it('returns an empty jar for a missing header', () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });

  it('skips a bare name with no value', () => {
    expect(parseCookies('a=1; broken; b=2')).toEqual({ a: '1', b: '2' });
  });

  it('keeps an explicitly empty value', () => {
    expect(parseCookies('a=')).toEqual({ a: '' });
  });
});

describe('serializeCookie', () => {
  it('defaults to the safe attributes', () => {
    const cookie = serializeCookie('name', 'value');

    expect(cookie).toContain('name=value');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('encodes a value that would otherwise break the header', () => {
    expect(serializeCookie('n', 'a b;c')).toContain('n=a%20b%3Bc');
  });

  it('omits Max-Age when none is given', () => {
    expect(serializeCookie('n', 'v')).not.toContain('Max-Age');
  });

  it('writes Max-Age=0 rather than omitting it', () => {
    expect(serializeCookie('n', 'v', { maxAge: 0 })).toContain('Max-Age=0');
  });

  it('lets the safe attributes be turned off explicitly', () => {
    const cookie = serializeCookie('n', 'v', {
      httpOnly: false,
      secure: false,
      sameSite: null
    });

    expect(cookie).not.toContain('HttpOnly');
    expect(cookie).not.toContain('Secure');
    expect(cookie).not.toContain('SameSite');
  });

  it('round-trips through parseCookies', () => {
    const cookie = serializeCookie('session', 'a b=c');
    const [pair] = cookie.split(';');

    expect(parseCookies(pair)).toEqual({ session: 'a b=c' });
  });
});
