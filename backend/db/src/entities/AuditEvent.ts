import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity({ tableName: 'audit_events' })
export class AuditEvent {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => User, { nullable: true })
    //@Index()
    user?: User;

    @Property({ fieldName: 'event_type' })
    @Index()
    eventType!: string;

    @Property({ type: 'json', nullable: true })
    data?: Record<string, any>;

    @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
    @Index()
    createdAt: Date = new Date();
}
