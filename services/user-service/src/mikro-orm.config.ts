import { defineConfig } from '@mikro-orm/better-sqlite';
import { TSMigrationGenerator } from '@mikro-orm/migrations';

export default defineConfig({
    dbName: '/user-service/data/user-service.db',
    entities: ['./dist/entities/**/*.js'],
    entitiesTs: ['./src/entities/**/*.ts'],
    debug: process.env.NODE_ENV !== 'production',
    logger: (message) => console.log(message),
	migrations: {
        path: './dist/migrations',      // compiled JS for runtime
        pathTs: './src/migrations',     // authoring location
        emit: 'ts',                     // generate TS files only
       generator: TSMigrationGenerator,
    },
});
