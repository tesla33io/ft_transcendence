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
            const { username: rawUsername, password: rawPassword } = req.body as any;
            
            console.log('🔵 [REGISTER] Extracted username:', rawUsername);
            console.log('🔵 [REGISTER] Extracted password length:', rawPassword?.length);

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

            // Generate tokens for the newly registered user
            // const deviceInfo = extractDeviceInfo(req);

            const sessionId = await app.sm.create({ userId: user.id, username: user.username });
            reply.setCookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 86400,
                path: '/',
            });
            return { 
                id: user.id, 
                username: user.username,
                message: 'User registered successfully'
            };

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

                    // Update last login
                    user.lastLogin = new Date();
                    await app.em.flush();

                    // Generate tokens
                    // const deviceInfo = extractDeviceInfo(req);

                    // Check if user is already logged in
                    const existingSession = await app.em.findOne(Session, { userId: user.id });
                    if (existingSession) {
                        if (existingSession.expiresAt <= new Date()) {
                            await app.em.removeAndFlush(existingSession);
                        } else {
                            return reply
                                .code(409)
                                .send({ error: 'User already logged in. Please log out first.' });
                        }
                    }

                    const sessionId = await app.sm.create({ userId: user.id, username: user.username });
                    reply.setCookie('sessionId', sessionId, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 86400,
                        path: '/',
                    });
                    return { 
                        id: user.id, 
                        username: user.username,
                        lastLogin: user.lastLogin,
                        message: 'Login successful'
                    };

                } catch (error) {
                    app.log.error('Login error: ' + String(error));
                    return reply.code(500).send({ 
                        error: 'Internal server error',
                        details: 'Unable to process login at this time'
                    });
                }
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
                        'Uploads and saves a new profile picture for the authenticated user. If an avatar already exists, it is deleted adn replaced with the new upload.',
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
                            error: 'User not foundd',
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
              
                const { username, profile } = req.body as any;
              
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
