import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
    dbName: 'user-service.db',
    entities: ['./src/entities/**/*.ts'],
    entitiesTs: ['./src/entities/**/*.ts'], // TS entities
    debug: process.env.NODE_ENV !== 'production',
    logger: (message) => console.log(message),
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
});

