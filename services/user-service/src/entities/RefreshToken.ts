import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

//@Index({ properties: ['userId'] })
//@Unique({ properties: ['userId', 'tokenHash'] })
@Entity()
@Index({ properties: ['expiresAt'] })
@Index({ properties: ['revoked'] })
export class RefreshToken {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User, { deleteRule: 'cascade' })
    user!: User;

    //@Property()
    //userId!: number;

    @Property()
    tokenHash!: string;

    @Property({ nullable: true })
    jti?: string;

    @Property({ onCreate: () => new Date() })
    issuedAt = new Date();

    @Property()
    expiresAt!: Date;

    @Property({ default: false })
    revoked = false;

    @Property({ nullable: true })
    deviceInfo?: string;
}

