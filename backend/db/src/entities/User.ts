import { Entity, PrimaryKey, Property, OneToMany, Collection, Index } from '@mikro-orm/core';
import { RefreshToken } from './RefreshToken';
import { RecoveryToken } from './RecoveryToken';
import { Friend } from './Friend';
import { AuditEvent } from './AuditEvent';
import { Game } from './Game';
import { GamePlayer } from './GamePlayer';
import { Tournament } from './Tournament';

@Entity({ tableName: 'users' })
export class User {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ unique: true })
    username!: string;

    @Property({ columnType: 'text', fieldName: 'pwd_hash' })
    pwdHash!: string;

    @Property({ onCreate: () => new Date() })
    @Index()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ nullable: true })
    @Index()
    lastLogin?: Date;

    @Property({ default: 0 })
    failedLogins: number = 0;

    @Property({ nullable: true })
    @Index()
    lockedUntil?: Date;

    @Property({ default: 'user' })
    role: string = 'user';

    @Property({ type: 'json', default: '{}' })
    profile: Record<string, any> = {};

    @Property({ type: 'json', default: '{}' })
    settings: Record<string, any> = {};

    @Property({ type: 'json', default: '{}' })
    stats: Record<string, any> = {};

    @Property({ default: false })
    twofaEnabled: boolean = false;

    @Property({ nullable: true, fieldName: 'twofa_secret_encrypted' })
    twofaSecretEncrypted?: string;

    @Property({ default: 1 })
    version: number = 1;

    @OneToMany(() => RefreshToken, token => token.user)
    refreshTokens = new Collection<RefreshToken>(this);

    @OneToMany(() => RecoveryToken, token => token.user)
    recoveryTokens = new Collection<RecoveryToken>(this);

    @OneToMany(() => Friend, friend => friend.userFrom)
    friendsFrom = new Collection<Friend>(this);

    @OneToMany(() => Friend, friend => friend.userTo)
    friendsTo = new Collection<Friend>(this);

    @OneToMany(() => AuditEvent, event => event.user)
    auditEvents = new Collection<AuditEvent>(this);

    @OneToMany(() => Game, game => game.createdBy)
    createdGames = new Collection<Game>(this);

    @OneToMany(() => GamePlayer, player => player.user)
    gamePlayers = new Collection<GamePlayer>(this);

    @OneToMany(() => Tournament, tournament => tournament.createdBy)
    createdTournaments = new Collection<Tournament>(this);
}
