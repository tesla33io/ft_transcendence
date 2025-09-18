import { EntityManager, MikroORM } from '@mikro-orm/core';

declare module 'fastify' {
    interface FastifyInstance {
        orm: MikroORM;
        em: EntityManager;
    }
}

