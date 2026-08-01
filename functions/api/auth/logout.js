import { deleteSession } from '../../lib/db';
import { json, sessionTokenFrom } from '../../lib/http';
import { clearedCookie, SESSION_COOKIE } from '../../lib/session';

// POST rather than GET: a sign-out reachable by navigation can be triggered by
// any page that embeds a link or an image pointing at it.
export const onRequestPost = async ({ request, env }) => {
  await deleteSession(env.DB, sessionTokenFrom(request));

  return json(
    { ok: true },
    { headers: { 'Set-Cookie': clearedCookie(SESSION_COOKIE) } }
  );
};
