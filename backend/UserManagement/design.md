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


```

> [!IMPORTANT]
> TODO: Indexes (performance and cleanup);
> 
> TODO: logout from all devices
> 
> TODO: stats endpoints
> 
> TODO: admin log view

## Useful links:
- OCC: https://www.wikiwand.com/en/articles/Optimistic_concurrency_control
- jti: https://mojoauth.com/glossary/jwt-jwt-id/

---

# API endpoints

### Auth
- `POST /api/v1/auth/register`
    - Body: `{ username, password }`
    - Response: `201 { id, username }` or `400`
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

- `POST /api/v1/auth/refresh`
    - Cookie: HttpOnly `refresh_token`
    - Response: `200 { accessToken }` (and optionally rotate refresh token)

- `POST /api/v1/auth/reset-password`
    - Body: `{ token, newPassword }`

### User CRUD (authenticated)

- `GET /api/v1/users/me`
    - Response: user profile (no pwd/twofa secret)

- `PATCH /api/v1/users/me`
    - Body: partial updates `{ username?, profile?, settings? }`
    - Response: `200` updated user

- `PATCH /api/v1/users/me/password`
    - Body: `{ currentPassword, newPassword }` -> verifies currentPassword, changes.

- `POST /api/v1/users/me/2fa/setup`
    - Response: `{ otpauth_url, qr_data }` (temporary secret returned encrypted in server-side state or temp token). User validates by submitting OTP.

- `POST /api/v1/users/me/2fa/confirm`
    - Body: `{ otp, tempSecretToken }` -> enable 2FA, store encrypted secret.

- `POST /api/v1/users/me/2fa/disable`
    - Body: `{ otp }` -> verify and disable.

- `DELETE /api/v1/users/me`
    - Body: confirm password or otp -> soft-delete or hard-delete (data retention policy)

### Admin

- `GET /api/v1/admin/users` - paginated user listing

- `GET /api/v1/admin/users/:id` - detailed info of a user

- `PATCH /api/v1/admin/users/:id` - change user info

- `DELETE /api/v1/admin/users/:id` - remove account

