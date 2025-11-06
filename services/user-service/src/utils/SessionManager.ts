import { MikroORM } from '@mikro-orm/core';
import { randomBytes } from 'crypto';
import { Session } from '../entities/Session';
import cookie from '@fastify/cookie';

export class SessionManager {
    constructor(private orm: MikroORM) {}

    async create(data: Record<string, any> = {}, ttl = 86400000): Promise<string> {
        const em = this.orm.em.fork();
        const sessionId = randomBytes(32).toString('hex');

        const session = em.create(Session, {
            id: sessionId,
            data,
            expiresAt: new Date(Date.now() + ttl),
            createdAt: new Date(Date.now()),
            updatedAt: new Date(Date.now())
        });

        await em.persistAndFlush(session);
        return sessionId;
    }

    async get(sessionId: string): Promise<Record<string, any> | null> {
        const em = this.orm.em.fork();
        const session = await em.findOne(Session, { id: sessionId });

        if (!session || session.expiresAt < new Date()) {
            if (session) await em.removeAndFlush(session);
            return null;
        }

        return session.data;
    }

    async update(sessionId: string, data: Record<string, any>): Promise<boolean> {
        const em = this.orm.em.fork();
        const session = await em.findOne(Session, { id: sessionId });

        if (!session || session.expiresAt < new Date()) {
            return false;
        }

        session.data = data;
        await em.flush();
        return true;
    }

    async destroy(sessionId: string): Promise<void> {
        const em = this.orm.em.fork();
        const session = await em.findOne(Session, { id: sessionId });
        if (session) {
            await em.removeAndFlush(session);
        }
    }

    async cleanup(): Promise<void> {
        const em = this.orm.em.fork();
        await em.nativeDelete(Session, { expiresAt: { $lt: new Date() } });
    }
}

export async function setupSessionMiddleware(app: any, sessionManager: SessionManager) {
    await app.register(cookie);

    app.addHook('onRequest', async (req: any, reply: any) => {
        if (req.routeOptions?.config?.skipSession) {
            req.session = {};
            req.sessionId = null;
            return;
        }
        const sessionId = req.cookies.sessionId;

        if (sessionId) {
            const data = await sessionManager.get(sessionId);
            if (data) {
                req.session = data;
                req.sessionId = sessionId;
                return;
            }
        }

        req.session = {};
        req.sessionId = null;
    });

    app.addHook('onSend', async (req: any, reply: any) => {
        if (req.routeOptions?.config?.skipSession) {
            return;
        }
        if (!req.sessionId && Object.keys(req.session).length > 0) {
            // Create new session
            const newSessionId = await sessionManager.create(req.session);
            reply.setCookie('sessionId', newSessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 86400, // 1 day in seconds
                path: '/',
            });
        } else if (req.sessionId && Object.keys(req.session).length > 0) {
            // Update existing session
            await sessionManager.update(req.sessionId, req.session);
        } else if (req.sessionId && Object.keys(req.session).length === 0) {
            // Destroy session if empty
            await sessionManager.destroy(req.sessionId);
        	reply.clearCookie('sessionId');
        }
    });
}


