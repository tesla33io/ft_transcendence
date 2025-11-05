import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { server } from 'typescript';

export interface JWTPayload {
    id: number;
    username: string;
    role: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthRequest extends FastifyRequest {
    user?: JWTPayload;
}



export class JWTHelper {
    constructor(private app: FastifyInstance) {}

    /**
     * Create both access and refresh tokens
     */
    createTokens(userId: number, username: string, role: string): TokenPair {
        const server = this.app as any;
		const accessToken = server.jwt.sign(
            { id: userId, username, role },
            { expiresIn: '15m' }
        );

        const refreshToken = server.jwt.sign(
            { id: userId, username, type: 'refresh' },
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): JWTPayload | null {
        try {
			const server = this.app as any;
            return server.jwt.verify(token) as JWTPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract token from Authorization header
     */
    extractToken(authHeader: string | undefined): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }

    // ===== MIDDLEWARE FUNCTIONS =====

    /**
     * MIDDLEWARE 1: Only check JWT exists and is valid
     * Usage: { onRequest: [jwtHelper.requireJWT()] }
     */
    requireJWT() {
        return async (request: AuthRequest, reply: FastifyReply) => {
            try {
                const token = this.extractToken(request.headers.authorization);
                if (!token) {
                    return reply.status(401).send({ 
                        error: 'Missing authorization token',
                        code: 'NO_TOKEN'
                    });
                }

                const payload = this.verifyToken(token);
                if (!payload) {
                    return reply.status(401).send({ 
                        error: 'Invalid or expired token',
                        code: 'INVALID_TOKEN'
                    });
                }

                request.user = payload;
                console.log(`Auth verified for user: ${payload.username}`);
            } catch (error) {
                return reply.status(401).send({ 
                    error: 'Unauthorized',
                    code: 'AUTH_FAILED'
                });
            }
        };
    }

    /**
     * MIDDLEWARE 2: Check JWT + specific role(s)
     * Usage: { onRequest: [jwtHelper.requireRole(['user'])] }
     * Usage: { onRequest: [jwtHelper.requireRole(['user', 'admin'])] }
     */
    requireRole(allowedRoles: string[]) {
        return async (request: AuthRequest, reply: FastifyReply) => {
            // First verify JWT
            await this.requireJWT()(request, reply);
            
            if (!request.user) {
                return;
            }

            // Then check role
            if (!allowedRoles.includes(request.user.role)) {
                console.warn(
                    `User ${request.user.username} (${request.user.role}) ` +
                    `tried to access role-restricted endpoint. Allowed: ${allowedRoles.join(', ')}`
                );
                return reply.status(403).send({ 
                    error: 'Insufficient permissions',
                    code: 'FORBIDDEN',
                    required_role: allowedRoles,
                    user_role: request.user.role
                });
            }

            console.log(`Role check passed for user: ${request.user.username} (${request.user.role})`);
        };
    }

    /**
     * MIDDLEWARE 3: Check JWT + user owns resource (ID match)
     * Usage: { onRequest: [jwtHelper.requireOwner()] }
     * Note: Expects params.id in the route
     */
    requireOwner() {
        return async (request: AuthRequest, reply: FastifyReply) => {
            // First verify JWT
            await this.requireJWT()(request, reply);
            
            if (!request.user) {
                return;
            }
			const params = request.params as Record<string, string>;
			const idstring = params.id;
            // Get ID from params
			if(!idstring){//this might need adjust ments for /me calls where it shloud just give from the jwt the userid 
				return reply.status(400).send({
					error: 'User ID is required in path',
					code: 'MISSING_ID'
				});
			}

            const targetUserId = parseInt(idstring,10);
            if (isNaN(targetUserId)) {
                return reply.status(400).send({ 
                    error: 'Invalid user ID in path',
                    code: 'INVALID_ID'
                });
            }

            // Check if user owns resource
            if (request.user.id !== targetUserId) {
                console.warn(
                    `User ${request.user.username} (ID: ${request.user.id}) ` +
                    `tried to access resource owned by user ID: ${targetUserId}`
                );
                return reply.status(403).send({ 
                    error: 'Access denied - you can only access your own profile',
                    code: 'NOT_OWNER',
                    your_id: request.user.id,
                    target_id: targetUserId
                });
            }

            console.log(`Owner check passed for user: ${request.user.username}`);
        };
    }
}