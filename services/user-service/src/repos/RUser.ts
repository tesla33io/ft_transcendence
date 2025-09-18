import { EntityRepository, EntityManager, RequiredEntityData } from "@mikro-orm/sqlite";
import { User } from "../entities/User";

export class RUser {
    private readonly repo: EntityRepository<User>;

    constructor(private readonly em: EntityManager) {
        this.repo = em.getRepository(User);
    }

    async findById(id: number): Promise<User | null> {
        return this.repo.findOne({id});
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.repo.findOne({username: username});
    }

    async findAll(): Promise<User[]> {
        return this.repo.findAll();
    }

    async create(user: RequiredEntityData<User>): Promise<User> {
        const newUser = this.repo.create(user);
        await this.em.persistAndFlush(newUser);
        return newUser;
    }

    async update(id: number, user: RequiredEntityData<User>): Promise<User | null> {
        const existingUser = await this.repo.findOne({id});
        if (!existingUser) return null;

        this.repo.assign(existingUser, user);
        await this.em.persistAndFlush(existingUser);
        return existingUser;
    }

    async delete(id: number): Promise<boolean> {
        const existingUser = await this.repo.findOne({id});
        if (!existingUser) return false;

        await this.em.removeAndFlush(existingUser);
        return true;
    }
}
