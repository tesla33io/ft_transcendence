PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- users: core user record
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT UNIQUE NOT NULL,
    pwd_hash    TEXT NOT NULL,                                -- argon2 hash
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login  DATETIME,                                     -- last successful login time
    failed_logins INTEGER DEFAULT 0,                          -- for lockout logic
    locked_until DATETIME,                                    -- account lock time (if brute force)
    role        TEXT DEFAULT 'user',                          -- user/admin
    profile JSON DEFAULT '{}',                                -- free-form profile JSON (avatar, etc.)
    settings JSON DEFAULT '{}',                               -- user preferences (audio, controls, etc.)
    stats JSON DEFAULT '{}',                                  -- aggregate stats (wins/losses/etc.)
    twofa_enabled BOOLEAN DEFAULT 0,
    twofa_secret_encrypted TEXT,                              -- encrypted TOTP secret (encrypt at rest)
    version INTEGER DEFAULT 1                                 -- optimistic concurrency
);

-- refresh_tokens: sessions related (rotation + revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    jti TEXT,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT 0,
    device_info TEXT,
    CONSTRAINT idx_refresh_user UNIQUE (user_id, token_hash)
);

-- one-time recovery codes
CREATE TABLE IF NOT EXISTS recovery_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0
);

-- Friends and friend requests
CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id_from INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME NULL,
    version INTEGER DEFAULT 1,
    CONSTRAINT unique_friend_pair UNIQUE (user_id_from, user_id_to),
    CHECK (user_id_from != user_id_to)
);

-- internal logging (successful/failed login, etc.)
CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT NOT NULL,
    data JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Placeholders / TBD
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    result JSON,
    created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER DEFAULT 0,
    team INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    started_at DATETIME,
    ended_at DATETIME,
    settings JSON DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tournament_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    pairings JSON NOT NULL
);

-- Performance and cleanup indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked);

CREATE INDEX IF NOT EXISTS idx_recovery_tokens_user_id ON recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_used ON recovery_tokens(used);

CREATE INDEX IF NOT EXISTS idx_friends_user_id_from ON friends(user_id_from);
CREATE INDEX IF NOT EXISTS idx_friends_user_id_to ON friends(user_id_to);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_started_at ON games(started_at);
CREATE INDEX IF NOT EXISTS idx_games_mode ON games(mode);

CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament_id ON tournament_rounds(tournament_id);

