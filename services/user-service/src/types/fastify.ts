import { FastifyInstance } from 'fastify';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';
import { SessionManager } from '../utils/SessionManager';

declare module 'fastify' {
    interface FastifyInstance {
        em: EntityManager;
        sm: SessionManager;
    }
    interface FastifyRequest {
        user?: User;
        session: Record<string, any>;
        sessionId: string | null;
    }
    interface RouteShorthandOptions {
        skipSession?: boolean;
    }
    interface FastifyContextConfig {
        skipSession?: boolean;
    }
    interface FastifySchema {
        tags?: string[];
        summary?: string;
        description?: string;
    }
}
