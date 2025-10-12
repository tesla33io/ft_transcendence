import { defineConfig } from '@mikro-orm/sqlite';
//import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
    dbName: 'user-service.db',
    //entities: ['./dist/entities'],  // compiled entities
    entities: ['./src/entities/**/*.ts'],
    entitiesTs: ['./src/entities/**/*.ts'], // TS entities
    debug: process.env.NODE_ENV !== 'production',
    logger: (message) => console.log(message),
    //metadataProvider: TsMorphMetadataProvider,
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
});

