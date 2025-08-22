# Data model (SQLite)

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- users: core user record
CREATE TABLE users (
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
CREATE TABLE refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        jti TEXT,
        issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked BOOLEAN DEFAULT 0,
        device_info TEXT,                                         -- optional: user agent / ip
        CONSTRAINT idx_refresh_user UNIQUE (user_id, token_hash)  -- for speed up of the queries
        );

-- one-time recovery codes
CREATE TABLE recovery_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0
        );

-- internal logging (successful/failed login, etc.)
CREATE TABLE audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        data JSON,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

-- Placeholders / TBD
CREATE TABLE games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL,                                      -- '1v1_remote','1v1_local','tournament'
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME NULL,
        result JSON,                                             -- players, scores, winner etc.
        created_by INTEGER REFERENCES users(id)
        );

CREATE TABLE game_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        score INTEGER DEFAULT 0,
        team INTEGER DEFAULT 1
        );

CREATE TABLE tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        started_at DATETIME,
        ended_at DATETIME,
        settings JSON DEFAULT '{}'
        );

CREATE TABLE tournament_rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        pairings JSON NOT NULL
        );

-- Performance and cleanup indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);
CREATE INDEX idx_recovery_tokens_user_id ON recovery_tokens(user_id);
CREATE INDEX idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
CREATE INDEX idx_recovery_tokens_used ON recovery_tokens(used);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_games_started_at ON games(started_at);
CREATE INDEX idx_games_mode ON games(mode);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX idx_tournament_rounds_tournament_id ON tournament_rounds(tournament_id);
```

## Useful links:
- OCC: https://www.wikiwand.com/en/articles/Optimistic_concurrency_control
- jti: https://mojoauth.com/glossary/jwt-jwt-id/

---

# API endpoints

### Auth
- `POST /api/v1/auth/register`
    - Body: `{ username, password }`
    - Response: `201 { id, username, recovery_codes: [...] }` or `400`
    - Actions: create user, generate and return recovery codes (or instruct client to download).

- `POST /api/v1/auth/login`
    - Body: `{ username, password }`
    - Response:
        - if not 2FA: `200 { accessToken, refreshToken (cookie) }`
        - if 2FA: `200 { twofa_required: true, tempToken }`
    - Actions: verify pwd, check locked/failed_logins, increment/reset counts, create refresh token row, set refresh token cookie.

- `POST /api/v1/auth/2fa/verify`
    - Body: `{ tempToken, otp }` (tempToken short-lived signed token)
    - Response: `200 { accessToken, refreshToken cookie }`

- `POST /api/v1/auth/logout`
    - Body: none or `{ refreshToken }`
    - Response: `204`
    - Actions: revoke current refresh token

- `POST /api/v1/auth/logout-all`
    - Headers: `Authorization: Bearer <accessToken>`
    - Response: `204`
    - Actions: revoke all refresh tokens for the authenticated user

- `POST /api/v1/auth/refresh`
    - Cookie: HttpOnly `refresh_token`
    - Response: `200 { accessToken }` (and optionally rotate refresh token)
    - Actions: validate refresh token, generate new access token, optionally rotate refresh token

- `POST /api/v1/auth/reset-password`
    - Body: `{ token, newPassword }`
    - Response: `200 { message: "Password reset successful" }` or `400`

### User CRUD (authenticated)

- `GET /api/v1/users/me`
    - Response: `200 { id, username, role, profile, settings, stats, twofa_enabled, created_at, last_login }`

- `PATCH /api/v1/users/me`
    - Body: partial updates `{ username?, profile?, settings? }`
    - Response: `200` updated user or `409`

- `PATCH /api/v1/users/me/password`
    - Body: `{ currentPassword, newPassword }`
    - Response: `200 { message: "Password updated" }` or `400`
    - Actions: verifies currentPassword, changes pwd_hash, logs audit event

- `POST /api/v1/users/me/2fa/setup`
    - Response: `200 { otpauth_url, qr_data, backup_codes: [...] }`
    - Actions: generate temporary secret, return QR code data and backup codes

- `POST /api/v1/users/me/2fa/confirm`
    - Body: `{ otp, tempSecretToken }`
    - Response: `200 { message: "2FA enabled successfully" }` or `400`
    - Actions: verify OTP, enable 2FA, store encrypted secret

- `POST /api/v1/users/me/2fa/disable`
    - Body: `{ otp }` or `{ recovery_code }`
    - Response: `200 { message: "2FA disabled" }` or `400`
    - Actions: verify and disable 2FA

- `DELETE /api/v1/users/me`
    - Body: `{ password }` or `{ otp }` (if 2FA enabled)
    - Response: `204`
    - Actions: verify credentials, soft-delete user account, revoke all tokens

### Stats (authenticated)

- `GET /api/v1/users/me/stats`
    - Response: `200 { games_played, games_won, win_rate, tournaments_entered, tournaments_won, recent_games: [...] }`

- `GET /api/v1/users/me/games`
    - Query params: `?limit=20&offset=0&mode=1v1_remote`
    - Response: `200 { games: [...], total, has_more }`

- `GET /api/v1/users/me/tournaments`
    - Query params: `?limit=10&offset=0&status=completed`
    - Response: `200 { tournaments: [...], total, has_more }`

### Games (authenticated)

- `POST /api/v1/games`
    - Body: `{ mode, players?: [...] }`
    - Response: `201 { id, mode, started_at, players }`
    - Actions: create new game, add players

- `GET /api/v1/games/:id`
    - Response: `200 { id, mode, started_at, ended_at?, result?, players }`

- `PATCH /api/v1/games/:id`
    - Body: `{ result?, ended_at? }`
    - Response: `200` updated game
    - Actions: update game state, calculate stats

- `GET /api/v1/games`
    - Query params: `?mode=1v1_remote&status=active&limit=20`
    - Response: `200 { games: [...], total }`

### Tournaments (authenticated)

- `POST /api/v1/tournaments`
    - Body: `{ name, settings }`
    - Response: `201 { id, name, created_by, settings }`

- `GET /api/v1/tournaments/:id`
    - Response: `200 { id, name, created_by, started_at?, ended_at?, settings, rounds?, participants? }`

- `POST /api/v1/tournaments/:id/join`
    - Response: `200 { message: "Joined tournament" }` or `400`

- `POST /api/v1/tournaments/:id/start`
    - Response: `200 { message: "Tournament started" }` or `400`
    - Actions: generate initial pairings, create tournament rounds

- `GET /api/v1/tournaments`
    - Query params: `?status=active&limit=20`
    - Response: `200 { tournaments: [...], total }`

### Admin (admin role required)

- `GET /api/v1/admin/users`
    - Query params: `?search=username&role=user&limit=50&offset=0`
    - Response: `200 { users: [...], total, has_more }`

- `GET /api/v1/admin/users/:id`
    - Response: `200` detailed user info including sensitive fields (excluding pwd_hash)

- `PATCH /api/v1/admin/users/:id`
    - Body: `{ username?, role?, locked_until?, failed_logins? }`
    - Response: `200` updated user
    - Actions: admin can override locks, change roles, etc.

- `DELETE /api/v1/admin/users/:id`
    - Response: `204`
    - Actions: hard delete user account and all associated data

- `GET /api/v1/admin/audit-logs`
    - Query params: `?user_id=123&event_type=login_failed&limit=100&from=2024-01-01&to=2024-12-31`
    - Response: `200 { events: [...], total }`
    - Actions: paginated audit log viewing with filtering

- `GET /api/v1/admin/stats`
    - Response: `200 { total_users, active_users_30d, total_games, games_today, failed_logins_24h }`

- `POST /api/v1/admin/users/:id/unlock`
    - Response: `200 { message: "User unlocked" }`
    - Actions: clear failed_logins, remove locked_until

- `POST /api/v1/admin/users/:id/revoke-sessions`
    - Response: `200 { message: "All sessions revoked", revoked_count }`
    - Actions: revoke all refresh tokens for specified user

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username is required",
    "details": {
      "field": "username",
      "constraint": "required"
    }
  }
}
```

## Authentication & Security

- Access tokens are short-lived JWT (15 minutes)
- Refresh tokens are longer-lived (30 days) and stored as HttpOnly cookies
- Rate limiting on auth endpoints (5 attempts per minute per IP)
- Account lockout after 5 failed login attempts (30 minutes)
- Password requirements: min 8 chars, mixed case, numbers, special chars
- All sensitive operations require re-authentication or 2FA
- Audit logging for security events

## Database Cleanup Tasks

Recommended scheduled cleanup tasks:

```sql
-- Clean up expired refresh tokens (daily)
DELETE FROM refresh_tokens WHERE expires_at < datetime('now');

-- Clean up used/expired recovery tokens (daily)
DELETE FROM recovery_tokens WHERE (used = 1 OR expires_at < datetime('now'));

-- Archive old audit events (weekly, keep 1 year)
DELETE FROM audit_events WHERE created_at < datetime('now', '-1 year');

-- Clean up old games (monthly, configurable retention)
DELETE FROM games WHERE ended_at < datetime('now', '-6 months');
```
