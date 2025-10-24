import { defineConfig } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

export default defineConfig({
    driver: SqliteDriver,
    dbName: 'user-service.db',
    entities: ['./src/entities/**/*.ts'],
    entitiesTs: ['./src/entities/**/*.ts'], // TS entities
    debug: process.env.NODE_ENV !== 'production',
    logger: (message: string) => console.log(message),
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
});

