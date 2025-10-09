import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';

export default async function usersRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const { username, password } = (request.body as any) ?? {};
    const hashed = await bcrypt.hash(password, 10);
    await app.db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    return { success: true };
  });
}