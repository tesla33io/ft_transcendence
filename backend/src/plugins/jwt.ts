import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async (app) => {
  app.register(fastifyJwt, { secret: process.env.JWT_SECRET! });
  app.decorate("authenticate", async (req, reply) => {
    try { await req.jwtVerify(); }
    catch (err) { reply.send(err); }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
}

