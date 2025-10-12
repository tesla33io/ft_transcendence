import { defineConfig } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
    dbName: 'user-service.db',
    entities: ['./dist/entities'],  // compiled entities
    entitiesTs: ['./src/entities'], // TS entities
    debug: process.env.NODE_ENV !== 'production',
    metadataProvider: TsMorphMetadataProvider,
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
});

