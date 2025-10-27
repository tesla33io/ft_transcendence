import { Entity, PrimaryKey, Property, Enum, OneToMany, ManyToMany, Collection } from '@mikro-orm/core';
import { UserStatistics } from './UserStatistics.js';
import { MatchHistory } from './MatchHistory.js';

// Enums for type safety and data validation
export const UserRole ={
    USER: 'user',
    ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const OnlineStatus = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    AWAY: 'away',
    IN_GAME: 'in_game',
    BUSY: 'busy',
} as const;

export type OnlineStatus = typeof OnlineStatus[keyof typeof OnlineStatus];


@Entity()
export class User {
    // Primary identification
    @PrimaryKey({ type: 'number' })
    id!: number;

    @Property({ type: 'string', unique: true, length: 30 })
    username!: string;

    @Property({ type: 'string', columnType: 'text' })
    passwordHash!: string;

    // Avatar management
    @Property({ type: 'string', nullable: true, columnType: 'text' })
    avatarUrl?: string;

    // Status and activity
    @Enum(() => OnlineStatus)
    onlineStatus: OnlineStatus = OnlineStatus.OFFLINE;

    @Property({ type: 'string', nullable: true, length: 50 })
    activityType?: string;

    // Security and authentication
    @Enum(() => UserRole)
    role: UserRole = UserRole.USER;

    // Two-factor authentication
    @Property({ type: 'boolean', default: false })
    twoFactorEnabled: boolean = false;

    @Property({ type: 'string', nullable: true, columnType: 'text' })
    twoFactorSecret?: string;

    @Property({ type: 'string', nullable: true, columnType: 'text' })
    backupCodes?: string; // JSON array of backup codes

    @Property({ type: 'string', nullable: true })
    profilePicURI?: string;

    // Timestamps
    @Property({ type: 'datetime', nullable: true })
    lastLogin?: Date;

    // Relationships
    @OneToMany(() => UserStatistics, (stats) => stats.user)
    statistics = new Collection<UserStatistics>(this);

    @OneToMany(() => MatchHistory, (match) => match.user)
    matchHistory = new Collection<MatchHistory>(this);

    // Friend relationships
    @ManyToMany(() => User)
    friends = new Collection<User>(this);

    // Helper methods for business logic
    //isOnline(): boolean {
    //    return this.onlineStatus === OnlineStatus.ONLINE;
    //}

    //isInGame(): boolean {
    //    return this.onlineStatus === OnlineStatus.IN_GAME;
    //}
}
