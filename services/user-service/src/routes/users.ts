import '../types/fastify';
import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { User } from '../entities/User';
import { Session } from '../entities/Session';
import { FastifyRequest, FastifyReply } from 'fastify';
import { mkdir, unlink } from 'fs/promises'; // adjust import line at top of users.ts

import { join } from 'path';
import { randomBytes } from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { FromSchema } from "json-schema-to-ts";

import { TwoFactorService } from '../utils/TwoFactorService';
import { LockMode } from '@mikro-orm/core';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profiles');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ValidationError {
    field: string;
    message: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}


//////// SCHEMAS ////////////////////////////////////////
const ErrorSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' },
        details: { type: 'string' }
    },
    required: ['error']
};


const authBodySchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 32 },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        twoFactorCode: { type: 'string', minLength: 6, maxLength: 8 }, // Optional 2FA code
        enable2FA: { type: 'boolean' }, // Optional: enable 2FA during registration
    },
    additionalProperties: false,
} as const;
type AuthBody = FromSchema<typeof authBodySchema>;


const userStatsSchema = {
    type: 'object',
    properties: {
        totalGames: { type: 'number' },
        wins: { type: 'number' },
        losses: { type: 'number' },
        draws: { type: 'number' },
        averageGameDuration: { type: 'number' },
        longestGame: { type: 'number' },
        bestWinStreak: { type: 'number' },
        currentRating: { type: 'number' },
        highestRating: { type: 'number' },
        ratingChange: { type: 'number' },
    },
    required: [
        'totalGames', 'wins', 'losses', 'draws',
        'averageGameDuration', 'longestGame',
        'bestWinStreak', 'currentRating', 'highestRating', 'ratingChange',
    ],
} as const;

const userProfileSchema = {
    type: 'object',
    properties: {
        avatarUrl: { type: ['string', 'null'] },
        onlineStatus: { type: ['string', 'null'] },
        activityType: { type: ['string', 'null'] },
    },
    required: ['avatarUrl', 'onlineStatus', 'activityType'],
} as const;

const userResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        username: { type: 'string' },
        role: { type: 'string' },
        profile: userProfileSchema,
        stats: userStatsSchema,
        twofa_enabled: { type: 'boolean' },
        last_login: { type: ['string', 'null'], format: 'date-time' },
    },
    required: [
        'id', 'username', 'role',
        'profile', 'stats', 'twofa_enabled', 'last_login',
    ],
} as const;
type UserResponse = FromSchema<typeof userResponseSchema>;


const uploadResponseSchema = {
    type: 'object',
    properties: {
        message: { type: 'string' },
        uri: { type: 'string' },
    },
    required: ['message', 'uri'],
} as const;
type UploadResponse = FromSchema<typeof uploadResponseSchema>;


const FriendSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        avatarUrl: { type: 'string', nullable: true },
        onlineStatus: { type: 'string' },
        activityType: { type: 'string', nullable: true },
        lastLogin: { type: 'string', format: 'date-time', nullable: true }
    }
} as const;
type FriendResponse = FromSchema<typeof FriendSchema>;


export default async function userRoutes(app: FastifyInstance) {
    await mkdir(UPLOAD_DIR, { recursive: true });

    app.post<{Body: AuthBody}>('/auth/register', {
        config: { skipSession: true },
        schema: {
            body: authBodySchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        username: { type: 'string' },
                        message: { type: 'string' },
                        // Optional 2FA setup data
                        twoFactorSetup: {
                            type: 'object',
                            properties: {
                                secret: { type: 'string' },
                                qrCodeUrl: { type: 'string' },
                                message: { type: 'string' }
                            }
                        }
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: ['string', 'array', 'object', 'null'] },
                    },
                },
            },
            tags: ['auth'],
            summary: 'Register a new user',
            description: 'Creates a new user account and sets a session cookie.',
        }}, async (req: FastifyRequest<{Body: AuthBody}>, reply: FastifyReply) => {
        
        // Add logging HERE
        console.log('🔵 [REGISTER] Request received');
        console.log('🔵 [REGISTER] Request body:', JSON.stringify(req.body));
        console.log('🔵 [REGISTER] Request headers:', req.headers);
        
        try {
            const { username: rawUsername, password: rawPassword, enable2FA } = req.body as any;
            
            console.log('🔵 [REGISTER] Extracted username:', rawUsername);
            console.log('🔵 [REGISTER] Extracted password length:', rawPassword?.length);
            console.log('🔵 [REGISTER] Enable 2FA:', enable2FA);

            // Validate username
            const usernameValidation = validateUsername(rawUsername);
            if (!usernameValidation.isValid) {
                console.log('❌ [REGISTER] Username validation failed:', usernameValidation.errors);
                return reply.code(400).send({ 
                    error: 'Invalid username',
                    details: usernameValidation.errors
                });
            }

            // Validate password
            const passwordValidation = validatePassword(rawPassword);
            if (!passwordValidation.isValid) {
                console.log('❌ [REGISTER] Password validation failed:', passwordValidation.errors);
                return reply.code(400).send({ 
                    error: 'Invalid password',
                    details: passwordValidation.errors
                });
            }

            console.log('✅ [REGISTER] Validations passed');
            const username = sanitizeInput(rawUsername);
            const password = rawPassword;

            // Check if user already exists
            const existing = await app.em.findOne(User, { username });
            if (existing) {
                return reply.code(409).send({ 
                    error: 'Username already exists',
                    details: 'Please choose a different username'
                });
            }

            // Hash password and create user
            const hash = await argon2.hash(password);
            const user = new User();
            user.username = username;
            user.passwordHash = hash;

            await app.em.persistAndFlush(user);

            // Create session AFTER user is created (so we have userId)
            const sessionId = await app.sm.create({ userId: user.id, username: user.username });
            reply.setCookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 86400,
                path: '/',
            });

            // If 2FA is requested during registration, set it up automatically
            let twoFactorSetup = undefined;
            if (enable2FA === true) {
                try {
                    // Generate TOTP secret and QR code (same logic as /auth/2fa/setup)
                    const { secret, qrCodeUrl } = await TwoFactorService.generateTOTPSecret(user.username);
                    
                    // Store temporarily (don't enable yet - user needs to verify first)
                    user.twoFactorSecret = secret;
                    user.twoFactorMethod = 'totp';
                    await app.em.flush();

                    twoFactorSetup = {
                        secret: secret,
                        qrCodeUrl: qrCodeUrl,
                        message: 'Scan QR code with authenticator app. You will need to verify the code to enable 2FA.'
                    };

                    app.log.info(`2FA setup initiated for new user ${user.id} during registration`);
                } catch (error) {
                    app.log.error(`Failed to set up 2FA during registration for user ${user.id}: ${String(error)}`);
                    // Don't fail registration if 2FA setup fails, just log it
                }
            }

            const response: any = { 
                id: user.id, 
                username: user.username,
                message: 'User registered successfully'
            };

            // Include 2FA setup data if it was requested
            if (twoFactorSetup) {
                response.twoFactorSetup = twoFactorSetup;
            }

            return reply.send(response);

        } catch (error) {
            console.error('🔴 [REGISTER] Error:', error);
            app.log.error('Registration error: ' + String(error));
            return reply.code(500).send({ 
                error: 'Internal server error',
                details: 'Unable to process registration at this time'
            });
        }
    });

    app.post<{Body: AuthBody}>('/auth/login', {
        config: { skipSession: true },
        schema: {
            body: authBodySchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        username: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: ['string', 'array', 'object', 'null'] },
                    },
                },
            },
            tags: ['auth'],
            summary: 'Authenticate user with given credentials',
            description: 'Verifies user credentials and sets a session cookie.',
        }}, async (req: FastifyRequest<{Body: AuthBody}>, reply: FastifyReply) => {
            try {
                if (!req.body || typeof req.body !== 'object') {
                    return reply.code(400).send({ 
                        error: 'Invalid request body',
                        details: 'Request body must be a valid JSON object'
                    });
                }

                const { username: rawUsername, password: rawPassword } = req.body as any;

                if (!rawUsername || typeof rawUsername !== 'string' || rawUsername.trim().length === 0) {
                    return reply.code(400).send({ 
                        error: 'Invalid credentials',
                        details: 'Username is required'
                    });
                }

                if (!rawPassword || typeof rawPassword !== 'string' || rawPassword.length === 0) {
                    return reply.code(400).send({ 
                        error: 'Invalid credentials',
                        details: 'Password is required'
                    });
                }

                const username = sanitizeInput(rawUsername);
                const password = rawPassword;

                const user = await app.em.findOne(User, { username });
                if (!user) {
                    return reply.code(401).send({ 
                        error: 'Invalid credentials',
                        details: 'Username or password is incorrect'
                    });
                }

                // Verify password
                const valid = await argon2.verify(user.passwordHash, password);
                if (!valid) {
                    return reply.code(401).send({ 
                        error: 'Invalid credentials',
                        details: 'Username or password is incorrect'
                    });
                }

                // Check if 2FA is enabled
                if (user.twoFactorEnabled) {
                    // Check if account is locked due to too many failed attempts
                    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
                        const minutesRemaining = Math.ceil((user.twoFactorLockedUntil.getTime() - Date.now()) / 60000);
                        return reply.code(429).send({ 
                            error: 'Account temporarily locked',
                            message: `Too many failed 2FA attempts. Please try again in ${minutesRemaining} minute(s).`,
                            retryAfter: minutesRemaining * 60
                        });
                    }

                    // Reset lockout if it has expired
                    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil <= new Date()) {
                        user.twoFactorFailedAttempts = 0;
                        user.twoFactorLockedUntil = undefined;
                        await app.em.flush();
                    }

                    const { twoFactorCode } = req.body as any;
                    
                    if (!twoFactorCode) {
                        if (user.twoFactorMethod === 'totp') {
                            return reply.code(200).send({
                                requires2FA: true,
                                method: 'totp',
                                message: 'Enter code from authenticator app'
                            });
                        }
                        // If 2FA is enabled but method is not set or invalid, still require code
                        return reply.code(200).send({
                            requires2FA: true,
                            method: 'totp',
                            message: 'Enter code from authenticator app'
                        });
                    }

                    // Verify 2FA code - ensure it's provided and not empty
                    // (twoFactorCode is guaranteed to be true here due to check above)
                    if (typeof twoFactorCode !== 'string' || twoFactorCode.trim().length === 0) {
                        return reply.code(401).send({ error: '2FA code is required' });
                    }

                    let twoFactorValid = false;
                    const codeLength = twoFactorCode.length;
                    const isTOTPLength = codeLength === 6;
                    const isBackupCodeLength = codeLength === 8;
                    let backupMatchedIndex = -1;
                    
                    if (user.twoFactorMethod === 'totp') {
                        // Always attempt TOTP verification for 6-digit codes
                        // Always attempt backup code verification for 8-digit codes
                        // This ensures similar execution time regardless of code type
                        let totpResult = false;
                        let backupResult = false;
                        let backupMatchedIndex = -1;

                        if (isTOTPLength) {
                            totpResult = TwoFactorService.verifyTOTP(twoFactorCode, user.twoFactorSecret!);
                            // Log with masked code in development for debugging
                            if (process.env.NODE_ENV === 'development') {
                                app.log.info(`TOTP verification for user ${user.id}: code=${mask2FACode(twoFactorCode)}, valid=${totpResult}`);
                            } else {
                                app.log.info(`TOTP verification for user ${user.id}: valid=${totpResult}`);
                            }
                        }
                        
                        // Always attempt backup code verification for 8-digit codes
                        // This ensures consistent timing even if TOTP was attempted
                        if (isBackupCodeLength) {
                            const backupVerification = await TwoFactorService.verifyBackupCode(twoFactorCode, user.backupCodes || '[]');
                            backupResult = backupVerification.valid;
                            backupMatchedIndex = backupVerification.matchedIndex;
                            // Log with masked code in development
                            if (process.env.NODE_ENV === 'development') {
                                app.log.info(`Backup code verification for user ${user.id}: code=${mask2FACode(twoFactorCode)}, valid=${backupResult}`);
                            } else {
                                app.log.info(`Backup code verification for user ${user.id}: valid=${backupResult}`);
                            }
                        }

                        // Use constant-time OR: result is true if either verification succeeded
                        // This prevents timing leaks about which verification method was used
                        twoFactorValid = totpResult || backupResult;
                    } else {
                        // Unknown or invalid 2FA method - only check backup codes
                        if (isBackupCodeLength) {
                            const backupVerification = await TwoFactorService.verifyBackupCode(twoFactorCode, user.backupCodes || '[]');
                            twoFactorValid = backupVerification.valid;
                            backupMatchedIndex = backupVerification.matchedIndex;
                        } else {
                            app.log.warn(`Invalid 2FA method for user ${user.id}: ${user.twoFactorMethod}`);
                            return reply.code(400).send({ error: 'Invalid 2FA configuration' });
                        }
                    }
                    
                    // If backup code was used, remove it by index
                    if (twoFactorValid && twoFactorCode.length === 8 && backupMatchedIndex >= 0) {
                        try {
                            const hashedCodes: string[] = JSON.parse(user.backupCodes || '[]');
                            // Remove the hash at the matched index
                            hashedCodes.splice(backupMatchedIndex, 1);
                            user.backupCodes = JSON.stringify(hashedCodes);
                            await app.em.flush();
                            app.log.info(`Removed used backup code at index ${backupMatchedIndex} for user ${user.id}`);
                        } catch (error) {
                            app.log.warn('Error removing backup code: ' + String(error));
                        }
                    }

                    // Handle failed 2FA attempts with rate limiting
                    if (!twoFactorValid) {
                        const MAX_ATTEMPTS = 5;
                        const LOCKOUT_MINUTES = 15;
                        
                        user.twoFactorFailedAttempts = (user.twoFactorFailedAttempts || 0) + 1;
                        
                        if (user.twoFactorFailedAttempts >= MAX_ATTEMPTS) {
                            // Lock the account
                            const lockoutUntil = new Date();
                            lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_MINUTES);
                            user.twoFactorLockedUntil = lockoutUntil;
                            
                            app.log.warn(`2FA account locked for user ${user.id} after ${MAX_ATTEMPTS} failed attempts`);
                            
                            await app.em.flush();
                            
                            return reply.code(429).send({ 
                                error: 'Too many failed attempts',
                                message: `Account temporarily locked. Please try again in ${LOCKOUT_MINUTES} minutes.`,
                                retryAfter: LOCKOUT_MINUTES * 60
                            });
                        }
                        
                        await app.em.flush();
                        
                        const remainingAttempts = MAX_ATTEMPTS - user.twoFactorFailedAttempts;
                        if (process.env.NODE_ENV === 'development') {
                            app.log.warn(`2FA validation failed for user ${user.id}: method=${user.twoFactorMethod}, code=${mask2FACode(twoFactorCode)}, attempts=${user.twoFactorFailedAttempts}/${MAX_ATTEMPTS}`);
                        } else {
                            app.log.warn(`2FA validation failed for user ${user.id}: method=${user.twoFactorMethod}, attempts=${user.twoFactorFailedAttempts}/${MAX_ATTEMPTS}`);
                        }
                        
                        return reply.code(401).send({ 
                            error: 'Invalid 2FA code',
                            remainingAttempts: remainingAttempts
                        });
                    }

                     // Success! Reset failed attempts counter
                    user.twoFactorFailedAttempts = 0;
                    user.twoFactorLockedUntil = undefined;
                    await app.em.flush();
                }

                // Update last login
                user.lastLogin = new Date();
                await app.em.flush();

                // Session management: block simultaneous logins while allowing re-login after closing window
                // Strategy: Use heartbeat to detect active sessions
                // - If session has recent heartbeat (< 10s) → another browser is active → block
                // - If session has no recent heartbeat (> 10s) → window was closed → allow login
                //
                // Note: We don't check cookies because cookies persist even after closing window

                const HEARTBEAT_THRESHOLD = 10 * 1000; // 10 seconds (2x heartbeat interval for safety)

                // Use transaction with lock to prevent race conditions
                const result = await app.em.transactional(async (em) => {
                    const existingSession = await em.findOne(
                        Session, 
                        { userId: user.id },
                        { refresh: true, lockMode: LockMode.PESSIMISTIC_WRITE }
                    );

                    if (existingSession) {
                        // Check if session is expired
                        if (existingSession.expiresAt <= new Date()) {
                            // Expired session - clean it up and allow login
                            await em.removeAndFlush(existingSession);
                        } else {
                            // Check if session is receiving heartbeats (updated recently)
                            const timeSinceLastHeartbeat = Date.now() - existingSession.updatedAt.getTime();
                            
                            // DEBUG: Log the timing information
                            app.log.info(`[Login Check] User ${user.id} - Session exists, last heartbeat was ${timeSinceLastHeartbeat}ms ago (threshold: ${HEARTBEAT_THRESHOLD}ms)`);
                            
                            if (timeSinceLastHeartbeat <= HEARTBEAT_THRESHOLD) {
                                // Session is active (receiving heartbeats) - another browser is using it
                                app.log.info(`[Login Check] User ${user.id} - BLOCKING login (session is active)`);
                                return { allowed: false, sessionId: null };
                            } else {
                                // Session is stale (no heartbeats) - user closed window
                                app.log.info(`[Login Check] User ${user.id} - ALLOWING login (session is stale, cleaning up)`);
                                await em.removeAndFlush(existingSession);
                            }
                        }
                    }

                    // Create new session INSIDE the transaction to prevent race conditions
                    const sessionId = randomBytes(32).toString('hex');
                    const newSession = em.create(Session, {
                        id: sessionId,
                        data: { userId: user.id, username: user.username },
                        userId: user.id,
                        expiresAt: new Date(Date.now() + 86400000), // 24 hours
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    await em.persistAndFlush(newSession);
                    
                    return { allowed: true, sessionId };
                });

                // If login was blocked, return 409
                if (!result.allowed) {
                    return reply.code(409).send({ 
                        error: 'User already logged in from another browser. Please log out first.' 
                    });
                }

                // Set cookie and return success
                reply.setCookie('sessionId', result.sessionId!, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 86400,
                    path: '/',
                });

                return reply.send({ 
                    id: user.id, 
                    username: user.username,
                    lastLogin: user.lastLogin,
                    message: 'Login successful'
                });
            } catch (error) {
                app.log.error('Login error: ' + String(error));
                return reply.code(500).send({ 
                    error: 'Internal server error',
                    details: 'Unable to process login at this time'
                });
            }
        });
    
    // POST /auth/2fa/disable
    app.post('/auth/2fa/disable', {
        schema: {
            tags: ['auth'],
            summary: 'Disable 2FA',
            body: {
                type: 'object',
                required: ['password'],
                properties: {
                    password: { type: 'string' }
                }
            }
        }
    }, async (req, reply) => {
        const userId = req.session?.userId;
        if (!userId) return reply.code(401).send({ error: 'Not authenticated' });

        const user = await app.em.findOne(User, { id: userId });
        if (!user) return reply.code(404).send({ error: 'User not found' });

        const { password } = req.body as { password: string };
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) {
            return reply.code(401).send({ error: 'Invalid password' });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.twoFactorMethod = undefined;
        user.backupCodes = undefined;
        await app.em.flush();

        return reply.send({ message: '2FA disabled successfully' });
    });

        // POST users/auth/logout
        app.post('/auth/logout', {
            schema: {
                tags: ['auth'],
                summary: 'Logout current user',
                description: 'Destroys the active session and clears session cookies.',
                response: {
                    200: {
                        type: 'object',
                        properties: { message: { type: 'string' } },
                        required: ['message'],
                    },
                    401: ErrorSchema,
                },
            },
        }, async (req, reply) => {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                reply.clearCookie('sessionId');
                return reply.send({ message: 'Already logged out' });
            }

            await app.sm.destroy(sessionId);
            req.session = {};
            reply.clearCookie('sessionId');
            return reply.send({ message: 'Logged out successfully' });
        });

        //POST /auth/heartbeat - Keep session alive
        app.post('/auth/heartbeat', {
            schema: {
                tags: ['auth'],
                summary: 'Session heartbeat',
                description: 'Updates session timestamp to indicate active browser',
                response: {
                    200: {
                        type: 'object',
                        properties: { ok: { type: 'boolean' } }
                    },
                    401: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error']
                    }
                }
            }
        }, async (req, reply) => {
            const sessionId = req.cookies?.sessionId;
            if (!sessionId) {
                return reply.code(401).send({ error: 'No session' });
            }

            // Find the session in the database and update its updatedAt timestamp
            const updated = await app.em.transactional(async (em) => {
                const session = await em.findOne(Session, { id: sessionId });
                
                if (!session) {
                    return { success: false, error: 'Invalid session' };
                }

                if (session.expiresAt <= new Date()) {
                    await em.removeAndFlush(session);
                    return { success: false, error: 'Session expired' };
                }

                // Touch the session to update updatedAt timestamp
                session.updatedAt = new Date();
                await em.flush();

                return { success: true };
            });

            if (!updated.success) {
                return reply.code(401).send({ error: updated.error });
            }

            return reply.send({ ok: true });
        });

        //POST /auth/2fa/setup
        app.post('/auth/2fa/setup', {
            schema: {
                tags: ['auth'],
                summary: 'Initiate 2FA setup',
                body: {
                    type: 'object',
                    required: ['method'],
                    properties: {
                        method: { type: 'string', enum: ['totp'] }
                    }
                },
                response: {
                    200: {
                        oneOf: [
                            {
                                type: 'object',
                                properties: {
                                    secret: { type: 'string' },
                                    qrCodeUrl: { type: 'string' },
                                    message: { type: 'string' }
                                },
                                required: ['secret', 'qrCodeUrl', 'message']
                            },
                            {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' }
                                },
                                required: ['message']
                            }
                        ]
                    },
                    400: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error']
                    },
                    401: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error']
                    },
                    403: {
                        type: 'object',
                        properties: { 
                            error: { type: 'string' },
                            message: { type: 'string' }
                        },
                        required: ['error', 'message']
                    },
                    404: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error']
                    }
                }
            }
        }, async (req, reply) => {
            const userId = req.session?.userId; // From session middleware
            if (!userId) return reply.code(401).send({ error: 'Not authenticated' });

            // In production, ensure the request is over HTTPS
            if (process.env.NODE_ENV === 'production') {
                // Use Fastify's protocol which respects trustProxy configuration
                // Also check the socket directly as a fallback
                const isSecure = 
                    req.protocol === 'https' || 
                    (req.socket as any)?.encrypted === true;
                
                if (!isSecure) {
                    app.log.warn(`2FA setup attempted over insecure connection from ${req.ip}`);
                    return reply.code(403).send({ 
                        error: 'Secure connection required',
                        message: '2FA setup requires HTTPS. Please use a secure connection.'
                    });
                }
            }

            const user = await app.em.findOne(User, { id: userId });
            if (!user) return reply.code(404).send({ error: 'User not found' });

            const { method } = req.body as { method: 'totp' };

            if (method === 'totp') {
                const { secret, qrCodeUrl } = await TwoFactorService.generateTOTPSecret(user.username);
                
                // Store temporarily (don't enable yet)
                user.twoFactorSecret = secret;
                user.twoFactorMethod = 'totp';
                await app.em.flush();

                return reply.send({
                    secret: secret,
                    qrCodeUrl: qrCodeUrl,
                    message: 'Scan QR code with authenticator app'
                });
            }

            return reply.code(400).send({ error: 'Invalid method. Only TOTP is supported.' });
        });

        // POST /auth/2fa/verify-setup
        app.post('/auth/2fa/verify-setup', {
            schema: {
                tags: ['auth'],
                summary: 'Verify and enable 2FA',
                body: {
                    type: 'object',
                    required: ['code'],
                    properties: {
                        code: { 
                            type: 'string',
                            minLength: 6,
                            maxLength: 6,
                            pattern: '^[0-9]{6}$' // Ensure exactly 6 digits
                         }
                    }
                }
            }
        }, async (req, reply) => {
            const userId = req.session?.userId;
            if (!userId) return reply.code(401).send({ error: 'Not authenticated' });
            
            const user = await app.em.findOne(User, { id: userId });
            if (!user) return reply.code(404).send({ error: 'User not found' });
            
            if (!user.twoFactorSecret && !user.twoFactorMethod) {
                return reply.code(400).send({ error: '2FA setup not initiated' });
            }

            const { code } = req.body as { code: string };

            // Additional runtime validation (defense in depth)
            if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
                return reply.code(400).send({ 
                    error: 'Invalid code format',
                    message: 'Code must be exactly 6 digits'
                });
            }

            let isValid = false;

            if (user.twoFactorMethod === 'totp') {
                isValid = TwoFactorService.verifyTOTP(code, user.twoFactorSecret!);
            } else {
                return reply.code(400).send({ error: 'Invalid 2FA method. Only TOTP is supported.' });
            }

            if (!isValid) {
                return reply.code(401).send({ error: 'Invalid verification code' });
            }

            // Enable 2FA and generate backup codes
            user.twoFactorEnabled = true;
            const backupCodes = TwoFactorService.generateBackupCodes();
            user.backupCodes = await TwoFactorService.hashBackupCodes(backupCodes);
            await app.em.flush();

            return reply.send({
                message: '2FA enabled successfully',
                backupCodes: backupCodes, // Show only once!
                warning: 'Save these backup codes in a safe place. They are going to be shown only once.'
            });
        });

        // GET users/me
        app.get<{Reply: UserResponse}>('/me', {
            schema: {
                response: {
                    200: userResponseSchema,
                    401: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error'],
                    },
                    404: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error'],
                    },
                },
                tags: ['profile'],
                summary: 'Get current authenticated user info',
                description: 'Returns the current user’s profile, stats, and settings.',
            }
        }, async (req: FastifyRequest, reply: FastifyReply) => {
            console.log(req);
            if (!req.cookies.sessionId || !req.session.userId) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            try {
                const user = await app.em.findOne(User, { id: req.session!.userId }, {
                    populate: ['statistics']
                });

                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                const response = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    profile: {
                        avatarUrl: user.avatarUrl,
                        onlineStatus: user.onlineStatus,
                        activityType: user.activityType
                    },
                    stats: {
                        totalGames: user.statistics.getItems()[0]?.totalGames || 0,
                        wins: user.statistics.getItems()[0]?.wins || 0,
                        losses: user.statistics.getItems()[0]?.losses || 0,
                        draws: user.statistics.getItems()[0]?.draws || 0,
                        averageGameDuration: user.statistics.getItems()[0]?.averageGameDuration || 0,
                        longestGame: user.statistics.getItems()[0]?.longestGame || 0,
                        bestWinStreak: user.statistics.getItems()[0]?.bestWinStreak || 0,
                        currentRating: user.statistics.getItems()[0]?.currentRating || 1000,
                        highestRating: user.statistics.getItems()[0]?.highestRating || 1000,
                        ratingChange: user.statistics.getItems()[0]?.ratingChange || 0
                    },
                    twofa_enabled: user.twoFactorEnabled,
                    last_login: user.lastLogin
                };

                return reply.send(response);
            } catch (error) {
                app.log.error('Error fetching user profile:' + String(error));
                return reply.code(500).send({ error: 'Internal server error' });
            }
        });

        app.post<{Reply: UploadResponse}>('/me/picture', {
            schema: {
                consumes: ['multipart/form-data'],
                response: {
                    200: uploadResponseSchema,
                    400: {
                        type: 'object',
                        properties: {
                            error: { type: 'string' },
                            details: { type: 'string' },
                        },
                        required: ['error', 'details'],
                    },
                    401: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error'],
                    },
                    404: {
                        type: 'object',
                        properties: { error: { type: 'string' } },
                        required: ['error'],
                    },
                },
                tags: ['profile'],
                summary: 'Upload or replace profile picture',
                description:
                    'Uploads and saves a new profile picture for the authenticated user. If an avatar already exists, it is deleted and replaced with the new upload.',
            }
        }, async (req: FastifyRequest, reply) => {
            const userId = req.session?.userId;
            if (!userId) {
                return reply.status(401).send({
                    error: 'Not authenticated',
                    message: 'Not authenticated',
                    uri: ''
                    });
            }

            try {
                // authentication
                const user = await app.em.findOne(User, { id: userId });
                if (!user) {
                    return reply.code(401).send({ 
                        error: 'User not found',
                        message: 'User not found',
                        uri: ''
                    });
                }

                // const existingUser = await app.em.findOne(User, { id: userId });
                // if (!existingUser) {
                // return reply.code(404).send({
                //     error: 'User not found',
                //     message: 'User not found',
                //     uri: ''
                // });
                // }

                const data = await req.file();
                if (!data) {
                    return reply.code(400).send({ 
                        error: 'No file provided',
                        uri: "",
                        message: 'Please upload an image file'
                    });
                }

                if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
                    return reply.code(400).send({ 
                        error: 'Invalid file type',
                        uri: "",
                        message: `Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
                    });
                }

                const chunks: Buffer[] = [];
                let size = 0;

                for await (const chunk of data.file) {
                    size += chunk.length;
                    if (size > MAX_FILE_SIZE) {
                        return reply.code(400).send({ 
                            error: 'File too large',
                            uri: "",
                            message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
                        });
                    }
                    chunks.push(chunk);
                }

                const ext = data.mimetype.split('/')[1];
                const randomName = randomBytes(16).toString('hex');
                const filename = `${randomName}.${ext}`;
                const filepath = join(UPLOAD_DIR, filename);

                // Save file
                const buffer = Buffer.concat(chunks);
                await pipeline(
                    async function* () { yield buffer; },
                    createWriteStream(filepath)
                );

                    // remove old avatar if it existed
                if (user.avatarUrl) {
                    const oldPath = join(process.cwd(), 'public', user.avatarUrl.replace(/^\//, ''));
                    try {
                    await unlink(oldPath);
                    } catch (err: any) {
                    if (err.code !== 'ENOENT') app.log.warn({ err }, 'Failed to remove old avatar');
                    }
                }

                user.avatarUrl = `/uploads/profiles/${filename}`;
                await app.em.flush();

                return { 
                    message: 'Profile picture uploaded successfully',
                    uri: user.avatarUrl
                };
            } catch (error) {
                app.log.error('Profile picture upload error: ' + String(error));
                return reply.code(500).send({ 
                    error: 'Internal server error',
                    uri: "",
                    message: 'Unable to upload profile picture at this time'
                });
            }
        });

        // PATCH users/me - Update user profile
        app.patch('/me', {
            schema: {
                tags: ['profile'],
                body: {
                    type: 'object',
                    properties: {
                        username: { type: 'string', minLength: 3, maxLength: 32 },
                    },
                    additionalProperties: false,
                    },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                        message: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                            id: { type: 'number' },
                            username: { type: 'string' },
                            },
                            required: ['id', 'username'],
                        },
                        },
                        required: ['message', 'user'],
                    },
                    400: ErrorSchema,
                    401: ErrorSchema,
                    404: ErrorSchema,
                    409: ErrorSchema,
                    },
                    summary: 'Update user profile',
                    description: 'Updates the user\'s profile information.',
                },
        }, async (req, reply) => {
            const userId = req.session?.userId;
            if (!userId) return reply.code(401).send({ error: 'Not authenticated' });
            
            const user = await app.em.findOne(User, { id: userId });
            if (!user) return reply.code(404).send({ error: 'User not found' });
            
            const { username } = req.body as any;
            
            if (username && username !== user.username) {
                const validation = validateUsername(username);
                if (!validation.isValid) return reply.code(400).send({ error: 'Invalid username', details: validation.errors });
            
                const existing = await app.em.findOne(User, { username });
                if (existing) return reply.code(409).send({ error: 'Username already exists' });
            
                user.username = sanitizeInput(username);
            }
            
            await app.em.flush();
            return reply.send({ message: 'Profile updated successfully', user: { id: user.id, username: user.username } });
        });

        //PATCH /users/me/password - Update user password
        app.patch('/me/password', {
            schema: {
                tags: ['profile'],
                body: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: { type: 'string', minLength: 8, maxLength: 128 },
                    newPassword: { type: 'string', minLength: 8, maxLength: 128 },
                },
                additionalProperties: false,
                },
                response: {
                200: {
                    type: 'object',
                    properties: {
                    message: { type: 'string' },
                    },
                    required: ['message'],
                },
                400: ErrorSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                },
                summary: 'Update user password',
                description: 'Updates the user\'s password.',
            },
            }, async (req, reply) => {
            const userId = req.session?.userId;
            if (!userId) return reply.code(401).send({ error: 'Not authenticated' });
            
            const { currentPassword, newPassword } = req.body as any;
            if (!currentPassword || !newPassword) return reply.code(400).send({ error: 'Missing required fields' });
            
            const user = await app.em.findOne(User, { id: userId });
            if (!user) return reply.code(404).send({ error: 'User not found' });
            
            const valid = await argon2.verify(user.passwordHash, currentPassword);
            if (!valid) return reply.code(400).send({ error: 'Current password is incorrect' });
            
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) return reply.code(400).send({ error: 'Invalid password', details: passwordValidation.errors });
            
            user.passwordHash = await argon2.hash(newPassword);
            await app.em.flush();
            
            return reply.send({ message: 'Password updated successfully' });
        });

        // GET /users/friends - Get user's friends list
        app.get<{Reply: FriendResponse}>('/friends', {
            schema: {
                tags: ['friends'],
                summary: 'Get user friends list',
                description: 'Returns the current user’s friends, including status and last login.',
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            friends: {
                                type: 'array',
                                items: FriendSchema
                            }
                        }
                    },
                    401: ErrorSchema,
                    404: ErrorSchema,
                    500: ErrorSchema
                }
            }

        }, async (req: FastifyRequest, reply: FastifyReply) => {
            if (!req.cookies.sessionId || !req.session.userId) {
                return reply.status(401).send({ 
                    error: 'Not authenticated',
                    message: 'Not authenticated',
                    uri: ''
                });
            }
            try {
                const user = await app.em.findOne(User, { id: req.session.userId }, {
                    populate: ['friends']
                });

                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                const friends = user.friends.getItems().map(friend => ({
                    id: friend.id,
                    username: friend.username,
                    avatarUrl: friend.avatarUrl,
                    onlineStatus: friend.onlineStatus,
                    activityType: friend.activityType,
                    lastLogin: friend.lastLogin
                }));

                return reply.send({ friends });
            } catch (error) {
                app.log.error('Error fetching friends: ' + String(error));
                return reply.code(500).send({ error: 'Internal server error' });
            }
        });

        // POST users/friends - Add a friend
        app.post('/friends', {
            schema: {
                tags: ['friends'],
                summary: 'Add friend',
                description: 'Adds another user to the current user’s friends list.',
                body: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: { type: 'string' },
                },
                additionalProperties: false,
                },
                response: {
                200: {
                    type: 'object',
                    properties: {
                    message: { type: 'string' },
                    friend: {
                        type: 'object',
                        properties: {
                        id: { type: 'number' },
                        username: { type: 'string' },
                        onlineStatus: { type: ['string', 'null'] },
                        },
                        required: ['id', 'username'],
                    },
                    },
                    required: ['message', 'friend'],
                },
                400: ErrorSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                409: ErrorSchema,
                500: ErrorSchema,
                },
            },
        }, async (req: FastifyRequest, reply: FastifyReply) => {
            if (!req.cookies.sessionId || !req.session.userId) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            try {
                const { username } = req.body as any;

                if (!username || typeof username !== 'string') {
                    return reply.code(400).send({ 
                        error: 'Invalid request',
                        details: 'Username is required'
                    });
                }

                const currentUser = await app.em.findOne(User, { id: req.session.userId }, {
                    populate: ['friends']
                });

                if (!currentUser) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                // Check if trying to add self
                if (username === currentUser.username) {
                    return reply.code(400).send({ error: 'Cannot add yourself as a friend' });
                }

                // Find the user to add as friend
                const friendToAdd = await app.em.findOne(User, { username });
                if (!friendToAdd) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                // Check if already friends
                const existingFriend = currentUser.friends.getItems().find(friend => friend.id === friendToAdd.id);
            if (existingFriend) {
                return reply.code(409).send({ error: 'User is already your friend' });
            }

            // Add friend relationship (bidirectional)
            currentUser.friends.add(friendToAdd);
            friendToAdd.friends.add(currentUser);

            await app.em.persistAndFlush([currentUser, friendToAdd]);

            return reply.send({ 
                message: 'Friend added successfully',
                friend: {
                    id: friendToAdd.id,
                    username: friendToAdd.username,
                    onlineStatus: friendToAdd.onlineStatus
                }
            });
            } catch (error) {
                app.log.error('Error adding friend: ' + String(error));
                return reply.code(500).send({ error: 'Internal server error' });
            }
        });

        // DELETE /users/friends/:username - Remove a friend
        app.delete('/friends/:username', {
            schema: {
                tags: ['friends'],
                summary: 'Remove friend',
                description: 'Removes a user from the current user’s friends list.',
                params: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: { type: 'string' },
                },
                },
                response: {
                200: {
                    type: 'object',
                    properties: { message: { type: 'string' } },
                    required: ['message'],
                },
                401: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema,
                },
            },
            }, async (req: FastifyRequest, reply: FastifyReply) => {
            if (!req.cookies.sessionId || !req.session.userId) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            try {
                const { username } = req.params as any;

                const currentUser = await app.em.findOne(User, { id: req.session.userId }, {
                    populate: ['friends']
                });

                if (!currentUser) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                const friendToRemove = await app.em.findOne(User, { username });
                if (!friendToRemove) {
                    return reply.code(404).send({ error: 'User not found' });
                }

                // Check if they are friends
                const existingFriend = currentUser.friends.getItems().find(friend => friend.id === friendToRemove.id);
            if (!existingFriend) {
                return reply.code(404).send({ error: 'User is not your friend' });
            }

            // Remove friend relationship (bidirectional)
            currentUser.friends.remove(friendToRemove);
            friendToRemove.friends.remove(currentUser);

            await app.em.persistAndFlush([currentUser, friendToRemove]);

            return reply.send({ message: 'Friend removed successfully' });
            } catch (error) {
                app.log.error('Error removing friend: ' + String(error));
                return reply.code(500).send({ error: 'Internal server error' });
            }
        });

        // GET users/search/:username - Search for users by username
        app.get('/search/:username', {
            schema: {
                tags: ['friends'],
                summary: 'Search users by username',
                description: 'Find other users whose usernames match the query so they can be added as friends.',
                params: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: { type: 'string' },
                },
                },
                response: {
                200: {
                    type: 'object',
                    properties: {
                    users: {
                        type: 'array',
                        items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            username: { type: 'string' },
                            avatarUrl: { type: ['string', 'null'] },
                            onlineStatus: { type: ['string', 'null'] },
                            activityType: { type: ['string', 'null'] },
                        },
                        required: ['id', 'username'],
                        },
                    },
                    },
                    required: ['users'],
                },
                401: ErrorSchema,
                },
            },
            }, async (req: FastifyRequest, reply: FastifyReply) => {
            if (!req.cookies.sessionId || !req.session.userId) {
                return reply.status(401).send({ error: 'Not authenticated' });
            }

            const { username } = req.params as any;
            const { limit = 20, offset = 0 } = req.query as any;

            const users: User[] = await app.em.find(
                User,
                { username: { $like: `%${username}%` }, id: { $ne: req.session.userId  } },
                { limit: Number(limit), offset: Number(offset) }
            );

            const searchResults = users.map((user: User) => ({
                id: user.id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                onlineStatus: user.onlineStatus,
                activityType: user.activityType
            }));

            return reply.send({ users: searchResults });
        });
}

// function extractDeviceInfo(req: any): string {
//     const userAgent = req.headers['user-agent'] || 'Unknown';
//     const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
//     return `${userAgent} | ${ip}`;
// }

function validateUsername(username: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!username || typeof username !== 'string') {
        errors.push({ field: 'username', message: 'Username is required and must be a string' });
        return { isValid: false, errors };
    }

    username = username.trim();
    if (username.length < 3) {
        errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    }
    if (username.length > 32) {
        errors.push({ field: 'username', message: 'Username must not exceed 32 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and hyphens' });
    }

    return { isValid: errors.length === 0, errors };
}

function validatePassword(password: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!password || typeof password !== 'string') {
        errors.push({ field: 'password', message: 'Password is required and must be a string' });
        return { isValid: false, errors };
    }

    if (password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
        errors.push({ field: 'password', message: 'Password must not exceed 128 characters' });
    }

    return { isValid: errors.length === 0, errors };
}

function sanitizeInput(input: string): string {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Helper function to mask sensitive 2FA codes in logs
// Shows first 2 digits, masks the rest (e.g., "123456" -> "12****")
function mask2FACode(code: string): string {
    if (!code || code.length < 3) return '***';
    // Show first 2 digits, mask the rest
    return code.substring(0, 2) + '*'.repeat(code.length - 2);
}
