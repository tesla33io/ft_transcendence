import fastify from 'fastify'
import { AuthRequest, JWTHelper } from './JWT_helper'
import { request } from 'http'

const server = fastify({logger: true})
const PORT = 3000

server.register(require('@fastify/cookie'))

server.register(require('@fastify/jwt'),{
    secret: process.env.JWT_SECRET || 'dev-secret-key'
})

server.register(require('@fastify/cors'),{
    origin:true,
    credentials: true
})

// Initialize JWT Helper
let jwtHelper: JWTHelper;

server.ready(() => {
    jwtHelper = new JWTHelper(server)
    console.log('jwt helper init')
})

server.get("/test/status", async (req, reply) => {
    return reply.status(200).send({test: 'OK\n'})
})

//set Bot only accesible for logged in users with Role user
server.post('/api/v1/game/bot-classic',
	{onRequest: [jwtHelper.requireRole(['user'])] },
	async (request: AuthRequest,reply) =>{
	console.log('[gateway] User $(request.user?.username} play against bot');
	return reply.proxy('http://game-service:5000');
}
);


// ===== GAME SERVICE PROXIES =====
server.register(require('@fastify/http-proxy'), {
    upstream: 'http://game-service:5000',
    prefix: '/api/v1/game',
    http2: false
})

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
            
            console.log('🔐 [GATEWAY] Intercepting auth response with onSend hook');
            
            // Handle both string and stream payloads
            let bodyString = payload;
            
            // If payload is a stream (BodyReadable), convert to string
            if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
                // It's a stream - need to read it
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

            console.log('📦 [GATEWAY] Response from user-service:', body);

            // Extract user info
            const userId = body.id;
            const username = body.username;
            const role = body.role || 'user';

            if (!userId || !username) {
                console.warn('⚠️ [GATEWAY] Missing user info in response:', body);
                return JSON.stringify(body);
            }

            // Create JWT tokens
            const { accessToken, refreshToken } = jwtHelper.createTokens(
                userId,
                username,
                role
            );

            console.log(`✅ [GATEWAY] JWT tokens created for user: ${username}`);

            // Set refresh token in httpOnly cookie
            reply.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60,
                path: '/'
            });

            console.log('🍪 [GATEWAY] Refresh token set in httpOnly cookie');

            // Add tokens to response
            body.accessToken = accessToken;
            body.refreshToken = refreshToken;

            console.log('📨 [GATEWAY] Sending response with JWT tokens to frontend');

            // Return modified payload as string
            return JSON.stringify(body);
        }
    } catch (error) {
        console.error('❌ [GATEWAY] Error in onSend hook:', error);
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

