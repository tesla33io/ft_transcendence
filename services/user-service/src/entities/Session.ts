import { Entity, PrimaryKey, Property } from '@mikro-orm/core';


@Entity()
export class Session {
    @PrimaryKey({ type: 'string' })
    id!: string;

    @Property({ type: 'json' })
    data: Record<string, any> = {};

    @Property({ type: 'datetime', nullable: false })
    expiresAt: Date = new Date();;

    @Property({ type: 'datetime', nullable: false })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
