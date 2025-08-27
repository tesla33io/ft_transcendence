import { Entity, PrimaryKey, Property, ManyToOne, Index, Unique } from '@mikro-orm/core';
import { User } from './User';

@Entity({ tableName: 'refresh_tokens' })
@Unique({ properties: ['user', 'tokenHash'], name: 'idx_refresh_user' })
export class RefreshToken {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => User)
    //@Index()
    user!: User;

    @Property({ fieldName: 'token_hash' })
    tokenHash!: string;

    @Property({ nullable: true })
    jti?: string;

    @Property({ onCreate: () => new Date(), fieldName: 'issued_at' })
    issuedAt: Date = new Date();

    @Property({ fieldName: 'expires_at' })
    @Index()
    expiresAt!: Date;

    @Property({ default: false })
    @Index()
    revoked: boolean = false;

    @Property({ nullable: true, fieldName: 'device_info' })
    deviceInfo?: string;
}
