import { FastifyInstance } from 'fastify';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';

declare module 'fastify' {
  interface FastifyInstance {
    em: EntityManager;
  }
  interface FastifyRequest {
    user?: User;
  }
}
