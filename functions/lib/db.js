import { hashToken, isExpired, SESSION_TTL_SECONDS } from './session';

/**
 * Looks up the user behind a GitHub profile, creating them on first sign-in.
 *
 * `login` and `avatar_url` are refreshed every time rather than only on insert:
 * both can change on GitHub, and a stale avatar in the header is a confusing
 * thing to debug months later. `github_id` is the stable identity and the one
 * the unique constraint is on — logins can be renamed and reused.
 */
export const findOrCreateUser = async (db, profile, now = Date.now()) => {
  const existing = await db
    .prepare('SELECT id FROM users WHERE github_id = ?')
    .bind(profile.githubId)
    .first();

  if (existing) {
    await db
      .prepare('UPDATE users SET login = ?, avatar_url = ? WHERE id = ?')
      .bind(profile.login, profile.avatarUrl, existing.id)
      .run();

    return { id: existing.id, login: profile.login, avatarUrl: profile.avatarUrl };
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO users (id, github_id, login, avatar_url, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, profile.githubId, profile.login, profile.avatarUrl, now)
    .run();

  return { id, login: profile.login, avatarUrl: profile.avatarUrl };
};

export const createSession = async (db, userId, token, now = Date.now()) => {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;

  await db
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(await hashToken(token), userId, now, expiresAt)
    .run();

  return { expiresAt };
};

/**
 * The user behind a session token, or null. An expired row is deleted on the way
 * out: sessions are only ever read through here, so this is the one place that
 * reliably sees them go stale, and it keeps the table from growing forever
 * without a scheduled job.
 */
export const findSessionUser = async (db, token, now = Date.now()) => {
  if (!token) {
    return null;
  }

  const tokenHash = await hashToken(token);

  const row = await db
    .prepare(
      `SELECT u.id, u.login, u.avatar_url, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`
    )
    .bind(tokenHash)
    .first();

  if (!row) {
    return null;
  }

  if (isExpired(row.expires_at, now)) {
    await db
      .prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();

    return null;
  }

  return { id: row.id, login: row.login, avatarUrl: row.avatar_url };
};

export const deleteSession = async (db, token) => {
  if (!token) {
    return;
  }

  await db
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(await hashToken(token))
    .run();
};

/** The stored board as raw JSON text, or null when the user has none yet. */
export const loadUserBoard = async (db, userId) => {
  const row = await db
    .prepare('SELECT data FROM boards WHERE user_id = ?')
    .bind(userId)
    .first();

  return row ? row.data : null;
};

export const saveUserBoard = async (db, userId, lists, now = Date.now()) => {
  await db
    .prepare(
      `INSERT INTO boards (user_id, data, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data,
                                          updated_at = excluded.updated_at`
    )
    .bind(userId, JSON.stringify(lists), now)
    .run();

  return { updatedAt: now };
};
