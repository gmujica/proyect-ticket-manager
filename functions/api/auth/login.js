import { json } from '../../lib/http';
import { createToken, stateCookie } from '../../lib/session';

export const onRequestGet = ({ request, env }) => {
  if (!env.GITHUB_CLIENT_ID) {
    return json(
      { error: 'GitHub OAuth is not configured' },
      { status: 500 }
    );
  }

  // The state is minted here and echoed back by GitHub in the callback. Without
  // it, an attacker can feed you a callback for *their* account and you end up
  // signed in as them, writing your work into their board.
  const state = createToken();

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set(
    'redirect_uri',
    new URL('/api/auth/callback', request.url).toString()
  );
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': stateCookie(state)
    }
  });
};