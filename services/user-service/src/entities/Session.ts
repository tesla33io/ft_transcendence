import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';


@Entity()
@Index({ properties: ['userId'] }) // Add index on userId for query performance
export class Session {
    @PrimaryKey({ type: 'string' })
    id!: string;

    @Property({ type: 'json' })
    data: Record<string, any> = {};

    @Property({ type: 'number', nullable: true })
    userId!: number;

    @Property({ type: 'datetime', nullable: false })
    expiresAt: Date = new Date();

    @Property({ type: 'datetime', nullable: false })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
