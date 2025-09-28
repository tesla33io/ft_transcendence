// filepath: /Users/helensirenko/Documents/42/ft_transcendence/ft_transcendence-backend/src/config/mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

export default defineConfig({
  driver: SqliteDriver,
  dbName: 'database.sqlite',
  entities: ['./dist/entities/**/*.js'],
  entitiesTs: ['./src/entities/**/*.ts'],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
  // SQLite specific options
  driverOptions: {
    connection: {
      enableForeignKeys: true, // Enable foreign key constraints
    },
  },
});