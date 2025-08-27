import { MikroORM, EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { dbConfig } from './config';
import * as entities from './entities/index';

export class Database {
    private static instance: Database;
    private _orm!: MikroORM;
    private _em!: EntityManager;

    private constructor() {}

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async initialize(): Promise<void> {
        this._orm = await MikroORM.init(dbConfig);
        this._em = this._orm.em;

        // Create schema if it doesn't exist
        const generator = this._orm.getSchemaGenerator();
        const meta = this._orm.getMetadata().get('User');
        console.log(meta.indexes);
        const meta2 = this._orm.getMetadata().get('Tournament');
        console.log(meta2.indexes);

        await generator.refreshDatabase();
    }

    get em(): EntityManager {
        if (!this._em) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this._em.fork();
    }

    get orm(): MikroORM {
        return this._orm;
    }

    async close(): Promise<void> {
        if (this._orm) {
            await this._orm.close();
        }
    }

    // Repository getters for easier access
    get userRepository() {
        return this.em.getRepository(entities.User);
    }

    get refreshTokenRepository() {
        return this.em.getRepository(entities.RefreshToken);
    }

    get recoveryTokenRepository() {
        return this.em.getRepository(entities.RecoveryToken);
    }

    get friendRepository() {
        return this.em.getRepository(entities.Friend);
    }

    get auditEventRepository() {
        return this.em.getRepository(entities.AuditEvent);
    }

    get gameRepository() {
        return this.em.getRepository(entities.Game);
    }

    get gamePlayerRepository() {
        return this.em.getRepository(entities.GamePlayer);
    }

    get tournamentRepository() {
        return this.em.getRepository(entities.Tournament);
    }

    get tournamentRoundRepository() {
        return this.em.getRepository(entities.TournamentRound);
    }
}
