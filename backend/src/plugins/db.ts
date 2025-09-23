import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default fp(async (app) => {
  const db = await open({
    filename: './data.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  app.decorate('db', db);
});

declare module 'fastify' {
  interface FastifyInstance {
    db: any;
  }
}