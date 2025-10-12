import { FastifyInstance } from 'fastify';
import { EntityManager } from '@mikro-orm/core';

declare module 'fastify' {
  interface FastifyInstance {
    em: EntityManager;
  }
}
