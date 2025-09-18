import { EntityRepository, EntityManager, RequiredEntityData, EntityData } from "@mikro-orm/sqlite";
import { RefreshToken } from "../entities/RefreshToken";

export class RRefreshToken {
    private readonly repo: EntityRepository<RefreshToken>;

    constructor(private readonly em: EntityManager) {
        this.repo = em.getRepository(RefreshToken);
    }

    async findById(id: number): Promise<RefreshToken | null> {
        return this.repo.findOne({ id });
    }

    async findByUserId(user_id: number): Promise<RefreshToken | null> {
        return this.repo.findOne({ userId: user_id });
    }

    async findByTokenHash(tkn_hash: string): Promise<RefreshToken | null> {
        return this.repo.findOne({ tokenHash: tkn_hash });
    }

    async findAll(): Promise<RefreshToken[]> {
        return this.repo.findAll();
    }

    async findAllActive(): Promise<RefreshToken[]> {
        return this.repo.find({ revoked: false });
    }

    async create(data: RequiredEntityData<RefreshToken>): Promise<RefreshToken> {
        const newToken = this.repo.create(data);
        await this.em.persistAndFlush(newToken);
        return newToken;
    }

    async update(id: number, data: EntityData<RefreshToken>): Promise<RefreshToken | null> {
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

