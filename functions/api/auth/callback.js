import { parseCookies } from '../../lib/cookies';
import { createSession, findOrCreateUser } from '../../lib/db';
import { json, serverError } from '../../lib/http';
import {
  clearedCookie,
  constantTimeEqual,
  createToken,
  sessionCookie,
  STATE_COOKIE
} from '../../lib/session';

const exchangeCode = async (env, code, redirectUri) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    return null;
  }

  // GitHub answers 200 with an `error` field rather than a 4xx when the code is
  // expired or already spent, so the status alone is not enough.
  const payload = await response.json();

  return payload.access_token ?? null;
};

const fetchProfile = async accessToken => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      // GitHub rejects API calls that arrive without one.
      'User-Agent': 'proyect-ticket-manager'
    }
  });

  if (!response.ok) {
    return null;
  }

  const profile = await response.json();

  if (typeof profile.id !== 'number') {
    return null;
  }

  return {
    githubId: profile.id,
    login: profile.login,
    avatarUrl: profile.avatar_url ?? null
  };
};

export const onRequestGet = async ({ request, env }) => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return json({ error: 'GitHub OAuth is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = parseCookies(request.headers.get('Cookie'))[STATE_COOKIE];

  // Whatever happens from here on, the state cookie has served its purpose and
  // is cleared, so a failed attempt cannot be retried with the same value.
  const stateCleared = clearedCookie(STATE_COOKIE);

  if (!code || !constantTimeEqual(state ?? '', expected ?? '')) {
    return json(
      { error: 'Invalid OAuth state' },
      { status: 400, headers: { 'Set-Cookie': stateCleared } }
    );
  }

  try {
    const accessToken = await exchangeCode(
      env,
      code,
      new URL('/api/auth/callback', request.url).toString()
    );

    if (!accessToken) {
      return json(
        { error: 'Could not complete sign-in' },
        { status: 502, headers: { 'Set-Cookie': stateCleared } }
      );
    }

    const profile = await fetchProfile(accessToken);

    if (!profile) {
      return json(
        { error: 'Could not read the GitHub profile' },
        { status: 502, headers: { 'Set-Cookie': stateCleared } }
      );
    }

    const user = await findOrCreateUser(env.DB, profile);
    const token = createToken();
    await createSession(env.DB, user.id, token);

    // Two Set-Cookie headers, which needs `append`: assigning them in an object
    // literal would silently keep only the last one.
    const headers = new Headers({ Location: '/' });
    headers.append('Set-Cookie', sessionCookie(token));
    headers.append('Set-Cookie', stateCleared);

    return new Response(null, { status: 302, headers });
  } catch {
    return serverError();
  }
};