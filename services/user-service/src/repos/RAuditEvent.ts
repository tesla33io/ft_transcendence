import { EntityRepository, EntityManager, RequiredEntityData } from "@mikro-orm/sqlite";
import { AuditEvent } from "../entities/AuditEvent";

export class RAuditEvent {
    private readonly repo: EntityRepository<AuditEvent>;

    constructor(private readonly em: EntityManager) {
        this.repo = em.getRepository(AuditEvent);
    }

    async findById(id: number): Promise<AuditEvent | null> {
        return this.repo.findOne({ id });
    }

    async findAll(): Promise<AuditEvent[]> {
        return this.repo.findAll();
    }

    async findByUser(user_id: number): Promise<AuditEvent[]> {
        return this.repo.find({ userId: user_id });
    }

    async findByEventType(evnt_type: string): Promise<AuditEvent[]> {
        return this.repo.find({ eventType: evnt_type });
    }

    async findRecent(limit: number = 20): Promise<AuditEvent[]> {
        return this.repo.findAll({
            orderBy: { createdAt: 'DESC' },
            limit,
        });
    }

    async create(data: RequiredEntityData<AuditEvent>): Promise<AuditEvent> {
        const newEvent = this.repo.create(data);
        await this.em.persistAndFlush(newEvent);
        return newEvent;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ id });
        if (!existing) return false;

        await this.em.removeAndFlush(existing);
        return true;
    }
}

