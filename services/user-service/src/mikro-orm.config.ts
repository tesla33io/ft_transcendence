import { SqliteDriver } from '@mikro-orm/better-sqlite';
import { defineConfig } from '@mikro-orm/better-sqlite';

export default defineConfig({
    driver: SqliteDriver,
    dbName: 'user-service.db',
    entities: ['./dist/entities/**/*.js'],
    entitiesTs: ['./src/entities/**/*.ts'],
    debug: process.env.NODE_ENV !== 'production',
    logger: (message) => console.log(message),
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
});
