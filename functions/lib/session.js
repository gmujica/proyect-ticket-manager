import { serializeCookie } from './cookies';

export const SESSION_COOKIE = 'ptm_session';
export const STATE_COOKIE = 'ptm_oauth_state';

// 32 bytes of CSPRNG output. The token is the only thing standing between a
// guess and someone else's board, so it is sized to make guessing hopeless
// rather than merely unlikely.
const TOKEN_BYTES = 32;

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

// The OAuth state only has to survive one round trip to GitHub and back. A long
// life would just widen the window in which a stolen state is replayable.
export const STATE_TTL_SECONDS = 10 * 60;

const toBase64Url = bytes =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const createToken = () => {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  return toBase64Url(bytes);
};

/** Hex SHA-256 of a token: what goes in the database, in place of the token. */
export const hashToken = async token => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Compares two strings without leaking, through timing, how far along they
 * matched.
 *
 * Workers ships `crypto.subtle.timingSafeEqual`, but it is a Cloudflare
 * extension that does not exist under Node, so using it here would make this
 * module untestable outside a Worker. The loop below is the same idea: fold the
 * whole input into an accumulator and decide once at the end. The length is
 * compared up front, which does leak length — irrelevant for the fixed-size
 * tokens this guards.
 */
export const constantTimeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return difference === 0;
};

export const isExpired = (expiresAt, now = Date.now()) =>
  typeof expiresAt !== 'number' || expiresAt <= now;

export const sessionCookie = token =>
  serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_TTL_SECONDS });

export const stateCookie = state =>
  serializeCookie(STATE_COOKIE, state, { maxAge: STATE_TTL_SECONDS });

// Max-Age=0 is what actually deletes a cookie; sending an empty value alone
// would leave it in place until it expired on its own.
export const clearedCookie = name => serializeCookie(name, '', { maxAge: 0 });