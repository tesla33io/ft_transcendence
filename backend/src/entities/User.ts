import { Entity, PrimaryKey, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { UserStatistics } from './UserStatistics.js';
import { MatchHistory } from './MatchHistory.js';

// Enums for type safety and data validation
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  IN_GAME = 'in_game',
  BUSY = 'busy',
}

@Entity()
export class User {
  // Primary identification
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 30 })
  username!: string;

  @Property({ columnType: 'text' })
  passwordHash!: string;

  // Avatar management
  @Property({ nullable: true, columnType: 'text' })
  avatarUrl?: string;

  // Status and activity
  @Enum(() => OnlineStatus)
  onlineStatus: OnlineStatus = OnlineStatus.OFFLINE;

  @Property({ nullable: true, length: 50 })
  activityType?: string;

  // Security and authentication
  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  // Two-factor authentication
  @Property({ default: false })
  twoFactorEnabled: boolean = false;

  @Property({ nullable: true, columnType: 'text' })
  twoFactorSecret?: string;

  @Property({ nullable: true, columnType: 'text' })
  backupCodes?: string; // JSON array of backup codes

  // Timestamps
  @Property({ nullable: true })
  lastLogin?: Date;

  // Relationships
  @OneToMany(() => UserStatistics, (stats) => stats.user)
  statistics = new Collection<UserStatistics>(this);

  @OneToMany(() => MatchHistory, (match) => match.user)
  matchHistory = new Collection<MatchHistory>(this);

  // Helper methods for business logic
  isOnline(): boolean {
    return this.onlineStatus === OnlineStatus.ONLINE;
  }

  isInGame(): boolean {
    return this.onlineStatus === OnlineStatus.IN_GAME;
  }
}