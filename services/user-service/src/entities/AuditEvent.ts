import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
// import { User } from './User';

//@Index({ properties: ['userId'] })
@Entity()
@Index({ properties: ['eventType'] })
@Index({ properties: ['createdAt'] })
export class AuditEvent {
    @PrimaryKey()
    id!: number;

    //@ManyToOne(() => User, { nullable: true })
    //user?: User;

    @Property({ nullable: true })
    userId?: number;

    @Property()
    eventType!: string;

    @Property({ type: 'json', nullable: true })
    data?: Record<string, any>;

    @Property({ onCreate: () => new Date() })
    createdAt = new Date();
}

