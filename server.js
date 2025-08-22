'use strict';

const fs = require('fs');
const path = require('path');
const fastify = require('fastify');
const jwt = require('@fastify/jwt');
const Database = require('better-sqlite3');
const argon2 = require('argon2');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DATABASE_FILE = process.env.DATABASE_FILE || './data/db.sqlite';
const INIT_SQL = process.env.INIT_SQL || path.join(__dirname, 'db', 'init_db.sql');
const JWT_SECRET = process.env.JWT_SECRET || (crypto.randomBytes(32).toString('hex'));
const ENCRYPTION_KEY_B64 = process.env.ENCRYPTION_KEY; // must be base64 of 32 bytes (256 bits)
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '15', 10);
const REFRESH_TOKEN_EXPIRE_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '30', 10);

if (!ENCRYPTION_KEY_B64) {
  console.warn('ENCRYPTION_KEY not set — generating a runtime key (dev only). Use a persistent key in production.');
}
const ENCRYPTION_KEY = ENCRYPTION_KEY_B64 ? Buffer.from(ENCRYPTION_KEY_B64, 'base64') : crypto.randomBytes(32);

fs.mkdirSync(path.dirname(DATABASE_FILE), { recursive: true });

const dbExisted = fs.existsSync(DATABASE_FILE);
const db = new Database(DATABASE_FILE);

// PRAGMAs
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// If DB didn't exist, run init SQL
if (!dbExisted) {
  if (!fs.existsSync(INIT_SQL)) {
    console.error('INIT_SQL not found at', INIT_SQL);
    process.exit(1);
  }
  const sql = fs.readFileSync(INIT_SQL, 'utf8');
  db.exec(sql);
  console.log('Database initialized from', INIT_SQL);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function makeAccessToken(payload) {
  // payload should include sub:userId
  const opts = { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` };
  return fastifyInstance.jwt.sign(payload, opts);
}

function makeRefreshToken() {
  return uuidv4().replace(/-/g, '') + crypto.randomBytes(8).toString('hex');
}

function encrypt(text) {
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store as base64 iv:tag:cipher
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decrypt(encStr) {
  const raw = Buffer.from(encStr, 'base64');
  const iv = raw.slice(0, 12);
  const tag = raw.slice(12, 28); // 16 bytes tag
  const ciphertext = raw.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}

// --- Fastify init ---
const fastifyInstance = fastify({ logger: true });

fastifyInstance.register(jwt, { secret: JWT_SECRET });

// JWT auth decorator
fastifyInstance.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// --- Routes ---

fastifyInstance.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

fastifyInstance.post('/register', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) {
    return reply.code(400).send({ error: 'username and password required' });
  }
  const uname = String(username).trim().toLowerCase();
  if (uname.length < 3) return reply.code(400).send({ error: 'username too short' });
  try {
    const pwdHash = await argon2.hash(password);
    const stmt = db.prepare('INSERT INTO users (username, pwd_hash) VALUES (?, ?)');
    const info = stmt.run(uname, pwdHash);
    return { id: info.lastInsertRowid, username: uname };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return reply.code(400).send({ error: 'username already exists' });
    }
    request.log.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});

fastifyInstance.post('/login', async (request, reply) => {
  const { username, password, device_info } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'username and password required' });
  const uname = String(username).trim().toLowerCase();
  const row = db.prepare('SELECT id, pwd_hash FROM users WHERE username = ?').get(uname);
  if (!row) return reply.code(401).send({ error: 'invalid credentials' });

  try {
    const ok = await argon2.verify(row.pwd_hash, password);
    if (!ok) throw new Error('badpwd');
  } catch (e) {
    // increment failed_logins
    db.prepare('UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?').run(row.id);
    return reply.code(401).send({ error: 'invalid credentials' });
  }

  // reset failed_logins and update last_login
  db.prepare('UPDATE users SET failed_logins = 0, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);

  // create tokens
  const accessToken = fastifyInstance.jwt.sign({ sub: String(row.id), username: uname }, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
  const refreshToken = makeRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, jti, issued_at, expires_at, revoked, device_info) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 0, ?)').run(row.id, tokenHash, uuidv4().replace(/-/g, ''), expiresAt, device_info || null);

  db.prepare('INSERT INTO audit_events (user_id, event_type, data) VALUES (?, ?, ?)').run(row.id, 'login_success', JSON.stringify({ device_info: device_info || '' }));

  return { access_token: accessToken, token_type: 'bearer', refresh_token: refreshToken };
});

fastifyInstance.post('/token/refresh', async (request, reply) => {
  const { refresh_token } = request.body || {};
  if (!refresh_token) return reply.code(400).send({ error: 'refresh_token required' });
  const tokenHash = hashToken(refresh_token);
  const row = db.prepare('SELECT id, user_id, revoked, expires_at FROM refresh_tokens WHERE token_hash = ?').get(tokenHash);
  if (!row) return reply.code(401).send({ error: 'invalid refresh token' });
  if (row.revoked) return reply.code(401).send({ error: 'refresh token revoked' });
  if (new Date(row.expires_at) < new Date()) return reply.code(401).send({ error: 'refresh token expired' });

  // rotate: revoke old and insert new
  const oldId = row.id;
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(oldId);

  const newRefresh = makeRefreshToken();
  const newHash = hashToken(newRefresh);
  const newExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, jti, issued_at, expires_at, revoked) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 0)').run(row.user_id, newHash, uuidv4().replace(/-/g, ''), newExpires);

  const accessToken = fastifyInstance.jwt.sign({ sub: String(row.user_id) }, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
  db.prepare('INSERT INTO audit_events (user_id, event_type, data) VALUES (?, ?, ?)').run(row.user_id, 'refresh_rotated', JSON.stringify({ old_refresh_id: oldId }));

  return { access_token: accessToken, token_type: 'bearer', refresh_token: newRefresh };
});

// Example protected route
fastifyInstance.get('/me', { preHandler: [fastifyInstance.authenticate] }, async (request, reply) => {
  const userId = request.user.sub;
  const row = db.prepare('SELECT id, username, created_at, role, profile, settings, stats, twofa_enabled FROM users WHERE id = ?').get(userId);
  if (!row) return reply.code(404).send({ error: 'not_found' });
  return row;
});

// Friend request endpoints (example; auth not wired into user id mapping)
fastifyInstance.post('/friends/request', async (request, reply) => {
  // for demo: require { from_user_id, to_user_id }; in real app derive from JWT
  const { from_user_id, to_user_id } = request.body || {};
  if (!from_user_id || !to_user_id) return reply.code(400).send({ error: 'from_user_id and to_user_id required' });
  if (from_user_id === to_user_id) return reply.code(400).send({ error: 'cannot friend yourself' });
  try {
    const info = db.prepare('INSERT INTO friends (user_id_from, user_id_to, status) VALUES (?, ?, ?)').run(from_user_id, to_user_id, 'pending');
    return { id: info.lastInsertRowid, status: 'pending' };
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') return reply.code(400).send({ error: 'friend request exists or invalid user' });
    request.log.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});

fastifyInstance.post('/friends/:id/accept', async (request, reply) => {
  const friendId = Number(request.params.id);
  const { acceptor_user_id } = request.body || {};
  if (!acceptor_user_id) return reply.code(400).send({ error: 'acceptor_user_id required' });
  const row = db.prepare('SELECT * FROM friends WHERE id = ? AND user_id_to = ?').get(friendId, acceptor_user_id);
  if (!row) return reply.code(404).send({ error: 'friend request not found' });
  db.prepare('UPDATE friends SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', friendId);
  return { id: friendId, status: 'accepted' };
});

// Admin unsafe SQL exec (dev only) - protect with ADMIN_KEY env if provided
fastifyInstance.post('/admin/exec-sql', async (request, reply) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey) {
    const header = request.headers['x-admin-key'] || '';
    if (header !== adminKey) return reply.code(403).send({ error: 'forbidden' });
  }
  const { sql } = request.body || {};
  if (!sql) return reply.code(400).send({ error: 'sql required' });
  try {
    db.exec(sql);
    return { status: 'ok' };
  } catch (err) {
    return reply.code(400).send({ error: String(err) });
  }
});

// --- Cleanups ---
async function doDailyCleanups() {
  db.prepare("DELETE FROM refresh_tokens WHERE expires_at < datetime('now')").run();
  db.prepare("DELETE FROM recovery_tokens WHERE (used = 1 OR expires_at < datetime('now'))").run();
  fastifyInstance.log.info('Daily cleanup done');
}
async function doWeeklyCleanups() {
  db.prepare("DELETE FROM friends WHERE status = 'pending' AND created_at < datetime('now', '-30 days')").run();
  db.prepare("DELETE FROM audit_events WHERE created_at < datetime('now', '-1 year')").run();
  fastifyInstance.log.info('Weekly cleanup done');
}
async function doMonthlyCleanups() {
  db.prepare("DELETE FROM games WHERE ended_at < datetime('now', '-6 months')").run();
  fastifyInstance.log.info('Monthly cleanup done');
}

function setupCleanupLoop() {
  // Run immediately then schedule
  (async () => {
    await doDailyCleanups();
    await doWeeklyCleanups();
    await doMonthlyCleanups();
  })();

  // daily (24h)
  setInterval(async () => {
    try {
      await doDailyCleanups();
    } catch (e) {
      fastifyInstance.log.error('daily cleanup error', e);
    }
  }, 24 * 3600 * 1000);

  // weekly
  setInterval(async () => {
    try {
      await doWeeklyCleanups();
    } catch (e) {
      fastifyInstance.log.error('weekly cleanup error', e);
    }
  }, 7 * 24 * 3600 * 1000);

  // monthly (approx)
  setInterval(async () => {
    try {
      await doMonthlyCleanups();
    } catch (e) {
      fastifyInstance.log.error('monthly cleanup error', e);
    }
  }, 30 * 24 * 3600 * 1000);
}

// Start server
const start = async () => {
  try {
    // setupCleanupLoop();
    const port = Number(process.env.PORT || 8000);
    await fastifyInstance.listen({ port, host: '0.0.0.0' });
    fastifyInstance.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastifyInstance.log.error(err);
    process.exit(1);
  }
};

start();

