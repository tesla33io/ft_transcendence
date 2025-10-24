import { FastifyInstance } from 'fastify';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/User';

declare module 'fastify' {
  interface FastifyInstance {
    em: EntityManager;
    //sm: SessionManager;
  }
  interface FastifyRequest {
    user?: User;
  }

  interface FastifySchema {
    tags?: string[];
    summary?: string;
    description?: string;
  }
}
