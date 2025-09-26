import { Entity, PrimaryKey, Property, Unique, Index } from '@mikro-orm/core';

@Entity()
@Index({ properties: ['id'] })
@Index({ properties: ['username'] })
@Index({ properties: ['lockedUntil'] })
export class User {
    @PrimaryKey()
    id!: number;

    @Property()
    @Unique()
    username!: string;

    @Property()
    pwdHash!: string;

    @Property({ onCreate: () => new Date() })
    createdAt = new Date();

    @Property({ onUpdate: () => new Date(), onCreate: () => new Date() })
    updatedAt = new Date();

    @Property({ nullable: true })
    lastLogin?: Date;

    @Property({ default: 0 })
    failedLogins = 0;

    @Property({ nullable: true })
    lockedUntil?: Date;

    @Property({ default: 'user' })
    role: string = 'user';

    @Property({ type: 'json', default: {} as any })
    profile: Record<string, any> = {};

    @Property({ type: 'json', default: {} as any})
    settings: Record<string, any> = {};

    @Property({ type: 'json', default: {} as any})
    stats: Record<string, any> = {};

    @Property({ default: false })
    twofaEnabled = false;

    @Property({ nullable: true })
    twofaSecretEncrypted?: string | null;

    @Property({ default: 1 })
    version: number = 1;
}
