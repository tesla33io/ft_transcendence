import { EntityManager, MikroORM } from '@mikro-orm/core';

declare module 'fastify' {
    interface FastifyInstance {
        orm: MikroORM;
        em: EntityManager;
    }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

