import { FtDatabase } from '../src/index';
import fs from 'fs';
import path from 'path';

let testDb: FtDatabase;
const TEST_DB_NAME = 'test.sqlite';

beforeAll(async () => {
    process.env.DB_NAME = TEST_DB_NAME;
    process.env.NODE_ENV = 'test';

    testDb = FtDatabase.getInstance();
    await testDb.initialize();
});

afterAll(async () => {
    if (testDb) {
        await testDb.close();
    }

    // Clean up test database file
    const dbPath = path.resolve(TEST_DB_NAME);
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    // Clean up WAL files
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
});

beforeEach(async () => {
    if (testDb) {
        const em = testDb.em;

        // Clear all tables in correct order (respecting foreign keys)
        await em.nativeDelete('game_players', {});
        await em.nativeDelete('games', {});
        await em.nativeDelete('tournament_rounds', {});
        await em.nativeDelete('tournaments', {});
        await em.nativeDelete('friends', {});
        await em.nativeDelete('audit_events', {});
        await em.nativeDelete('recovery_tokens', {});
        await em.nativeDelete('refresh_tokens', {});
        await em.nativeDelete('users', {});
    }
});

// Export test database for use in tests
export { testDb };
