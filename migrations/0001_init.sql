-- Timestamps are stored as integer epoch milliseconds rather than SQLite
-- datetimes: the Workers runtime deals in Date.now(), so this avoids a
-- conversion at every boundary and keeps comparisons plain integer maths.

CREATE TABLE users (
  id         TEXT    PRIMARY KEY,
  github_id  INTEGER NOT NULL UNIQUE,
  login      TEXT    NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL
);

-- The primary key is the SHA-256 of the session token, never the token itself:
-- a dump of this table then contains nothing that can be replayed as a valid
-- session. Lookups hash the incoming cookie and query by that hash, so the
-- comparison happens in the index rather than in application code.
CREATE TABLE sessions (
  token_hash TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Supports revoking every session of one user, and the expiry sweep.
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- One row per user holding the whole board as JSON. The app always loads and
-- saves the board as a unit, so splitting it into lists and cards tables would
-- add joins without removing a single round trip.
CREATE TABLE boards (
  user_id    TEXT    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL
);