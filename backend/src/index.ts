import Fastify from "fastify";

const app = Fastify({ logger: true });

import dbPlugin from './plugins/db';
import jwtPlugin from './plugins/jwt';
import usersRoutes from './routes/users';
app.register(dbPlugin);
app.register(jwtPlugin);
app.register(usersRoutes);

app.get('/ping', async () => ({ pong: 'it works!'}));

// Temporary helper to obtain a JWT for testing. Remove in production.
app.get('/dev/token', async () => {
  // Minimal payload; add claims as needed (e.g., sub, roles)
  const token = (app as any).jwt.sign({ sub: 'demo-user' });
  return { token };
});

// Example protected route using the JWT authenticate hook
app.get('/secure/ping', { preHandler: [async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
}] }, async (req) => ({ pong: 'secret' }));

app.get('/protected-route', { 
  preHandler: [async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }] 
}, async (req) => {
  // Your protected route logic here
  return { message: 'This is protected!' };
});

// JWT verification route
app.post('/user/verify', async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = (app as any).jwt.verify(token);
    
    return { 
      valid: true, 
      payload: decoded,
      message: 'Token is valid' 
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return reply.status(401).send({ 
      valid: false, 
      error: 'Invalid token',
      message: errorMessage 
    });
  }
});

app.get('/db/health', async () => {
  const row = await app.db.get(
    'SELECT COUNT(*) as count FROM users'
  );
  const users = row && typeof row.count !== 'undefined' ? Number(row.count) : 0;
  return { ok: true, users };
});

async function start() {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();