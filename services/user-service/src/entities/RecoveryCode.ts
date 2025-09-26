import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

//@Index({ properties: ['userId'] })
@Entity()
@Index({ properties: ['expiresAt'] })
@Index({ properties: ['used'] })
export class RecoveryCode {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User, { deleteRule: 'cascade' })
    user!: User;

    //@Property()
    //userId!: number;

    @Property()
    codeHash!: string;

    @Property({ onCreate: () => new Date() })
    createdAt = new Date();

    @Property()
    expiresAt!: Date;

    @Property({ default: false })
    used = false;
}

