import '../types/fastify';
import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { User } from '../entities/User';
//import { RefreshToken } from '../entities/RefreshToken';
import crypto from 'crypto';

interface ValidationError {
    field: string;
    message: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export default async function userRoutes(app: FastifyInstance) {

    app.post('/register', async (req, reply) => {
        try {
            if (!req.body || typeof req.body !== 'object') {
                return reply.code(400).send({ 
                    error: 'Invalid request body',
                    details: 'Request body must be a valid JSON object'
                });
            }

            const { username: rawUsername, password: rawPassword } = req.body as any;

            // Validate username
            const usernameValidation = validateUsername(rawUsername);
            if (!usernameValidation.isValid) {
                return reply.code(400).send({ 
                    error: 'Invalid username',
                    details: usernameValidation.errors
                });
            }

            // Validate password
            const passwordValidation = validatePassword(rawPassword);
            if (!passwordValidation.isValid) {
                return reply.code(400).send({ 
                    error: 'Invalid password',
                    details: passwordValidation.errors
                });
            }

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

    return { 
        id: user.id, 
        username: user.username,
        message: 'User registered successfully'
    };

        } catch (error) {
            app.log.error('Registration error: ' + String(error));
            return reply.code(500).send({ 
                error: 'Internal server error',
                details: 'Unable to process registration at this time'
            });
        }
    });

    app.post('/login', async (req, reply) => {
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
    if (username.length > 30) {
        errors.push({ field: 'username', message: 'Username must not exceed 30 characters' });
    }

    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username)) {
        errors.push({ 
            field: 'username', 
            message: 'Username can only contain letters, numbers, underscores, and hyphens' 
        });
    }

    if (!/^[a-zA-Z0-9]/.test(username)) {
        errors.push({ 
            field: 'username', 
            message: 'Username must start with a letter or number' 
        });
    }

    if (/[_-]{2,}/.test(username)) {
        errors.push({ 
            field: 'username', 
            message: 'Username cannot contain consecutive underscores or hyphens' 
        });
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

    if (password.length > 69) {
        errors.push({ field: 'password', message: 'Password must not exceed 69 characters' });
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
        errors.push({ field: 'password', message: 'Password must contain at least one number' });
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
        errors.push({ 
            field: 'password', 
            message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' 
        });
    }

    // Check for common weak patterns
    const commonPatterns = [
        /(.)\1{2,}/, // Three or more consecutive identical characters
        /123456|654321|abcdef|fedcba/i, // Sequential patterns
        /qwerty|asdfgh|zxcvbn/i, // Keyboard patterns
    ];

    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push({ 
                field: 'password', 
                message: 'Password contains common weak patterns (avoid repeated characters, sequences, or keyboard patterns)' 
            });
            break;
        }
    }

    const commonPasswords = [
        'password', 'password123', '123456789', 'qwerty123', 
        'admin123', 'letmein', 'welcome', 'monkey123'
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
        errors.push({ 
            field: 'password', 
            message: 'Password is too common or contains common password patterns' 
        });
    }

    return { isValid: errors.length === 0, errors };
}

function sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
}
