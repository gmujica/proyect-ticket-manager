// Cookie parsing and serialisation, written out rather than pulled from a
// package: Workers has no Node cookie library available and the two operations
// needed here are small enough that a dependency would cost more than it saves.

export const parseCookies = header => {
  const jar = {};

  if (!header) {
    return jar;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');

    // A cookie header can legally carry a bare name with no value; there is
    // nothing to read from it, so it is skipped rather than stored as empty.
    if (separator === -1) {
      continue;
    }

    const name = part.slice(0, separator).trim();

    if (name) {
      jar[name] = decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return jar;
};

/**
 * Builds a Set-Cookie value. The defaults are the safe ones on purpose, so a
 * caller has to opt *out* of HttpOnly or Secure rather than remember to opt in.
 */
export const serializeCookie = (name, value, options = {}) => {
  const {
    maxAge,
    path = '/',
    httpOnly = true,
    secure = true,
    sameSite = 'Lax'
  } = options;

  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`];

  if (typeof maxAge === 'number') {
    parts.push(`Max-Age=${Math.floor(maxAge)}`);
  }

  if (httpOnly) {
    parts.push('HttpOnly');
  }

  if (secure) {
    parts.push('Secure');
  }

  if (sameSite) {
    parts.push(`SameSite=${sameSite}`);
  }

  return parts.join('; ');
};