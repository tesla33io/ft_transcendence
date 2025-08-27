import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity({ tableName: 'recovery_tokens' })
export class RecoveryToken {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => User)
    //@Index()
    user!: User;

    @Property({ fieldName: 'token_hash' })
    tokenHash!: string;

    @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
    createdAt: Date = new Date();

    @Property({ fieldName: 'expires_at' })
    @Index()
    expiresAt!: Date;

    @Property({ default: false })
    @Index()
    used: boolean = false;
}
