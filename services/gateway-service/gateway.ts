import fastify from 'fastify'
import { AuthRequest, JWTHelper } from './JWT_helper'

const server = fastify({logger: true})
const PORT = 3000

const JWT_SECRET = process.env.JWT_SECRET
if(!JWT_SECRET){
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    console.error('Run: make setup');
    process.exit(1);
}

server.register(require('@fastify/cookie'))

server.register(require('@fastify/jwt'),{
    secret: process.env.JWT_SECRET
})

server.register(require('@fastify/cors'),{
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false
})

// Initialize JWT Helper
let jwtHelper: JWTHelper;

//counter for guest ID (starts -1 decrements ) -> we see if id is -1 its guest 
let guestIdCounter = -1;

// ===== WAIT FOR PLUGINS TO LOAD =====
server.after(async () => {
    jwtHelper = new JWTHelper(server)
    console.log('jwt helper init')
})

server.get("/test/status", async (req, reply) => {
    return reply.status(200).send({test: 'OK\n'})
})



//guest login 
// ===== GUEST JWT ENDPOINT =====
server.post('/api/v1/auth/guest', async (request: AuthRequest, reply: any) => {
    try {
        console.log('[GATEWAY] Guest login request');

        // Generate unique guest ID (negative integer)
        const guestId = guestIdCounter;
        guestIdCounter--; // Decrement for next guest
        
        const guestUsername = 'guest';

        // Create JWT tokens for guest
        const { accessToken, refreshToken } = jwtHelper.createTokens(
            guestId,    // id: "-1", "-2", etc.
            guestUsername,         // username: "guest"
            'guest'                // role: "guest"
        );

        console.log(`[GATEWAY] Guest tokens created: ID=${guestId}, Username=${guestUsername}`);

        // Set refresh token in httpOnly cookie
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60,  // 24 hours
            path: '/'
        });

        console.log('[GATEWAY] Guest refresh token set in httpOnly cookie');

        // Return tokens to frontend
        return reply.status(200).send({
            id: guestId,
            username: guestUsername,
            role: 'guest',
            message: 'Guest session created',
            accessToken: accessToken,
            refreshToken: refreshToken
        });

    } catch (error) {
        console.error('[GATEWAY] Error creating guest session:', error);
        return reply.status(500).send({
            error: 'Failed to create guest session',
            code: 'GUEST_SESSION_FAILED'
        });
    }
});

//me end point 
server.get('/api/v1/auth/me', async (request: AuthRequest, reply: any) => {
    try {
        console.log('[GATEWAY] /me endpoint called');

        // Verify JWT
        await jwtHelper.requireJWT()(request, reply);

        if (!request.user) {
            return reply.status(401).send({
                error: 'Unauthorized',
                code: 'NO_USER'
            });
        }

        console.log(`[GATEWAY] /me: Returning user info for ${request.user.username}`);

        return reply.status(200).send({
            id: request.user.id,
            username: request.user.username,
            role: request.user.role
        });

    } catch (error) {
        console.error('[GATEWAY] Error in /me endpoint:', error);
        return reply.status(401).send({
            error: 'Unauthorized',
            code: 'AUTH_FAILED'
        });
    }
});

// ===== LOGOUT ENDPOINT =====
server.post('/api/v1/auth/logout', async (request: AuthRequest, reply: any) => {
    try {
        console.log('[GATEWAY] /logout endpoint called');

        // Verify JWT first
        await jwtHelper.requireJWT()(request, reply);

        if (!request.user) {
            return reply.status(401).send({
                error: 'Unauthorized',
                code: 'NO_USER'
            });
        }

        console.log(`✅ [GATEWAY] User ${request.user.username} logging out`);

        // forward logout to user-service so the session is destroyed
        const userServiceResponse = await fetch('http://user-service:8000/users/auth/logout', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            cookie: request.headers.cookie ?? ''  // forward sessionId cookie
            },
            body: JSON.stringify({}) // user-service route expects a JSON body
        });
    
        if (!userServiceResponse.ok) {
            console.error(
            '[GATEWAY] user-service logout failed:',
            userServiceResponse.status,
            await userServiceResponse.text()
            );
            return reply.status(500).send({
            error: 'Logout failed on user-service',
            code: 'LOGOUT_FAILED'
            });
        }

        // Clear refresh token cookie
        reply.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        console.log('[GATEWAY] Refresh token cookie cleared');

        return reply.status(200).send({
            message: 'Logged out successfully',
            code: 'LOGOUT_SUCCESS'
        });

    } catch (error) {
        console.error('[GATEWAY] Error in /logout endpoint:', error);
        return reply.status(500).send({
            error: 'Logout failed',
            code: 'LOGOUT_FAILED'
        });
    }
});

// ===== REFRESH TOKEN ENDPOINT =====
server.post('/api/v1/auth/refresh', async (request: AuthRequest, reply: any) => {
    try {
        console.log('[GATEWAY] /refresh endpoint called');

        // Get refresh token from cookie (cast to any because AuthRequest doesn't include cookies)
        const refreshToken = (request as any).cookies?.refreshToken;

        if (!refreshToken) {
            console.error('[GATEWAY] No refresh token in cookies');
            return reply.status(401).send({
                error: 'Unauthorized',
                code: 'NO_REFRESH_TOKEN',
                message: 'Refresh token not found'
            });
        }

        // Verify refresh token
        try {
            const decoded = jwtHelper.verifyRefreshToken(refreshToken);
            console.log(` [GATEWAY] Refresh token valid for user: ${decoded.username}`);

            // Create new tokens
            const { accessToken, refreshToken: newRefreshToken } = jwtHelper.createTokens(
                decoded.id,
                decoded.username,
                decoded.role || 'user'
            );

            // Update refresh token cookie
            (reply as any).setCookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/'
            });

            console.log(`[GATEWAY] New tokens created for user: ${decoded.username}`);

            return reply.status(200).send({
                accessToken: accessToken,
                refreshToken: newRefreshToken,
                message: 'Token refreshed successfully'
            });

        } catch (error) {
            console.error('[GATEWAY] Refresh token verification failed:', error);
            return reply.status(401).send({
                error: 'Unauthorized',
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh token is invalid or expired'
            });
        }

    } catch (error) {
        console.error('[GATEWAY] Error in /refresh endpoint:', error);
        return reply.status(500).send({
            error: 'Server error',
            code: 'REFRESH_FAILED'
        });
    }
});

// ===== GLOBAL HOOK: PROTECT ALL GAME ROUTES =====
server.addHook('onRequest', async (request: AuthRequest, reply) => {
    // Only protect /api/v1/game/* routes
    if (!request.url.startsWith('/api/v1/game/')) {
        return; // Skip - not a game route
    }

    console.log(`[GATEWAY] Game route request: ${request.method} ${request.url}`);

    // Determine which middleware to apply based on endpoint
    if (request.url.includes('/bot-classic') || 
        request.url.includes('/join-classic')) {
        // Bot and Classic require 'user' role (not guest)
        console.log(`[GATEWAY] Enforcing ROLE check for: ${request.url}`);
        await jwtHelper.requireRole(['user'])(request, reply);
        
    } else if (request.url.includes('/join-tournament')) {
        // Tournament just needs valid JWT (any role: user or guest)
        console.log(`[GATEWAY] Enforcing JWT check for tournament: ${request.url}`);
        await jwtHelper.requireJWT()(request, reply);
        
    } else {
        // All other /api/v1/game/* routes need JWT
        console.log(`[GATEWAY] Enforcing JWT check for: ${request.url}`);
        await jwtHelper.requireJWT()(request, reply);
    }
});

// for user routes 
server.addHook('onRequest', async (request: AuthRequest, reply) => {
    if (!request.url.startsWith('/users')) {
        return; // Skip non-user routes
    }

    // Allow public auth endpoints
    const publicAuthRoutes = [
        '/users/auth/login',
        '/users/auth/register',
        '/users/auth/refresh'
    ];

    if (publicAuthRoutes.some(route => request.url.includes(route))) {
        return; // No JWT needed for these
    }

    // All other /users/* routes require JWT
    await jwtHelper.requireJWT()(request, reply);

	//add here later for the post jwt with id check for uploading new avater name etc.
});

// ===== GAME SERVICE PROXY =====
server.register(require('@fastify/http-proxy'), {
    upstream: 'http://game-service:5000',
    prefix: '/api/v1/game',
    http2: false
})

// ===== WEBSOCKET PROXIES =====
server.register(require('@fastify/http-proxy'), {
    upstream: 'http://game-service:5005',
    prefix: '/ws/classic',
    websocket: true,
    http2: false
})

server.register(require('@fastify/http-proxy'), {
    upstream: 'http://game-service:5006',
    prefix: '/ws/tournament',
    websocket: true,
    http2: false
})

// ===== USER SERVICE PROXY =====
server.register(require('@fastify/http-proxy'), {
    upstream: 'http://user-service:8000',
    prefix: '/users',
    rewritePrefix: '/users',
    http2: false
})

// ===== INTERCEPT AUTH RESPONSES WITH JWT =====
server.addHook('onSend', async (request: any, reply: any, payload: any) => {
    try {
        // Only process successful auth responses
        if (reply.statusCode === 200 && 
            (request.url.includes('/users/auth/register') || 
             request.url.includes('/users/auth/login'))) {
            
            console.log('[GATEWAY] Intercepting auth response with onSend hook');
            
            let bodyString = payload;
            
            // If payload is a stream (BodyReadable), convert to string
            if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
                bodyString = await new Promise((resolve, reject) => {
                    let data = '';
                    payload.on('data', (chunk: any) => {
                        data += chunk;
                    });
                    payload.on('end', () => {
                        resolve(data);
                    });
                    payload.on('error', reject);
                });
            }

            // Parse JSON
            let body = bodyString;
            if (typeof bodyString === 'string') {
                body = JSON.parse(bodyString);
            }

            console.log('[GATEWAY] Response from user-service:', body);

            const userId = body.id;
            const username = body.username;
            const role = body.role || 'user';

            if (!userId || !username) {
                console.warn('[GATEWAY] Missing user info in response:', body);
                return JSON.stringify(body);
            }

            // Create JWT tokens
            const { accessToken, refreshToken } = jwtHelper.createTokens(
                userId,
                username,
                role
            );

            console.log(`[GATEWAY] JWT tokens created for user: ${username}`);

            // Set refresh token in httpOnly cookie
            reply.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/'
            });

            console.log('[GATEWAY] Refresh token set in httpOnly cookie');

            // Add tokens to response
            body.accessToken = accessToken;
            body.refreshToken = refreshToken;

            console.log('[GATEWAY] Sending response with JWT tokens to frontend');

            return JSON.stringify(body);
        }
    } catch (error) {
        console.error('[GATEWAY] Error in onSend hook:', error);
    }

    return payload;
})

const start = async() =>{
    try{
        await server.listen({port:PORT, host:'0.0.0.0'})
        console.log(`🚀 Gateway server started on port ${PORT}`)
    }
    catch (error){
        server.log.error(error)
        process.exit(1)
    }
}

start()

