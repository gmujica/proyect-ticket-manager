import { parseCookies } from './cookies';
import { findSessionUser } from './db';
import { SESSION_COOKIE } from './session';

export const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });

export const unauthorized = () => json({ error: 'Not signed in' }, { status: 401 });

/**
 * Server-side failures are answered with a generic message on purpose: the
 * caller can do nothing useful with the detail, and error text is a classic way
 * of handing an attacker the shape of the backend for free.
 */
export const serverError = () =>
  json({ error: 'Something went wrong' }, { status: 500 });

export const sessionTokenFrom = request =>
  parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE];

/** The signed-in user for a request, or null. */
export const userFor = ({ request, env }) =>
  findSessionUser(env.DB, sessionTokenFrom(request));
