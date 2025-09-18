import { EntityRepository, EntityManager, RequiredEntityData, EntityData } from "@mikro-orm/sqlite";
import { RecoveryToken } from "../entities/RecoveryToken";

export class RRecoveryToken {
    private readonly repo: EntityRepository<RecoveryToken>;

    constructor(private readonly em: EntityManager) {
        this.repo = em.getRepository(RecoveryToken);
    }

    async findById(id: number): Promise<RecoveryToken | null> {
        return this.repo.findOne({ id });
    }

    async findByTokenHash(tkn_hash: string): Promise<RecoveryToken | null> {
        return this.repo.findOne({ tokenHash: tkn_hash });
    }

    async findByUserId(user_id: number): Promise<RecoveryToken[]> {
        return this.repo.find({ userId: user_id });
    }

    async findAll(): Promise<RecoveryToken[]> {
        return this.repo.findAll();
    }

    async findAllActive(): Promise<RecoveryToken[]> {
        return this.repo.find({
            used: false,
            expiresAt: { $gt: new Date() },
        });
    }

    async create(data: RequiredEntityData<RecoveryToken>): Promise<RecoveryToken> {
        const newToken = this.repo.create(data);
        await this.em.persistAndFlush(newToken);
        return newToken;
    }

    async update(id: number, data: EntityData<RecoveryToken>): Promise<RecoveryToken | null> {
        const existing = await this.repo.findOne({ id });
        if (!existing) return null;

        this.repo.assign(existing, data);
        await this.em.persistAndFlush(existing);
        return existing;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ id });
        if (!existing) return false;

        await this.em.removeAndFlush(existing);
        return true;
    }
}

