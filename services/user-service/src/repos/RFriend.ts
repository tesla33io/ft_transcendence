import { EntityRepository, EntityManager, RequiredEntityData, EntityData } from "@mikro-orm/sqlite";
import { Friend } from "../entities/Friend";

export class RFriend {
    private readonly repo: EntityRepository<Friend>;

    constructor(private readonly em: EntityManager) {
        this.repo = em.getRepository(Friend);
    }

    async findById(id: number): Promise<Friend | null> {
        return this.repo.findOne({ id });
    }

    async findAll(): Promise<Friend[]> {
        return this.repo.findAll();
    }

    async findBetweenUsers(user_id_from: number, user_id_to: number): Promise<Friend | null> {
        return this.repo.findOne({
            userIdFrom: user_id_from,
            userIdTo: user_id_to,
        });
    }

    async findAllForUser(userId: number): Promise<Friend[]> {
        return this.repo.find({
            $or: [{ userIdFrom: userId }, { userIdTo: userId }],
        });
    }

    async findAllPending(userId: number): Promise<Friend[]> {
        return this.repo.find({
            userIdTo: userId,
            status: 'pending',
        });
    }

    async findAllAccepted(userId: number): Promise<Friend[]> {
        return this.repo.find({
            userIdTo: userId,
            status: 'accepted',
        });
    }

    async findAllDenied(userId: number): Promise<Friend[]> {
        return this.repo.find({
            userIdTo: userId,
            status: 'denied',
        });
    }

    async create(data: RequiredEntityData<Friend>): Promise<Friend> {
        const newFriend = this.repo.create(data);
        await this.em.persistAndFlush(newFriend);
        return newFriend;
    }

    async update(id: number, data: EntityData<Friend>): Promise<Friend | null> {
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

