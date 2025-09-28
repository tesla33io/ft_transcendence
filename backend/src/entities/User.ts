import { Entity, PrimaryKey, Property, Enum, OneToMany, Collection, Index } from '@mikro-orm/core';
import { UserStatistics } from './UserStatistics';
import { MatchHistory } from './MatchHistory';
import { UsernameHistory } from './UsernameHistory';
import { UserSessions } from './UserSessions';
import { UserPreferences } from './UserPreferences';

// Enums for type safety and data validation
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  IN_GAME = 'in_game',
  BUSY = 'busy',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum StatusVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  HIDDEN = 'hidden',
}

export enum MatchHistoryVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

@Entity()
@Index({ properties: ['username'], options: { collate: 'NOCASE' } })
@Index({ properties: ['onlineStatus'] })
@Index({ properties: ['lastSeen'] })
@Index({ properties: ['createdAt'] })
export class User {
  // Primary identification
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 30 })
  username!: string;


  @Property({ columnType: 'text' })
  passwordHash!: string;

  // Profile information
  @Property({ nullable: true, length: 50 })
  displayName?: string;

  @Property({ nullable: true, length: 50 })
  firstName?: string;

  @Property({ nullable: true, length: 50 })
  lastName?: string;

  @Property({ nullable: true, columnType: 'text' })
  bio?: string;

  @Property({ nullable: true, length: 100 })
  location?: string;

  // Avatar management
  @Property({ nullable: true, columnType: 'text' })
  avatarUrl?: string;

  @Property({ default: false })
  hasCustomAvatar: boolean = false;

  @Property({ nullable: true })
  avatarUploadDate?: Date;

  // Status and activity
  @Enum(() => OnlineStatus)
  onlineStatus: OnlineStatus = OnlineStatus.OFFLINE;

  @Property({ nullable: true, length: 50 })
  activityType?: string;

  @Property()
  lastSeen!: Date;

  @Property()
  lastActivity!: Date;

  // Security and authentication
  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property({ default: false })
  isVerified: boolean = false;

  @Property({ default: false })
  isLocked: boolean = false;

  @Property({ default: 0 })
  failedLoginAttempts: number = 0;

  @Property({ nullable: true })
  lockedUntil?: Date;

  // Two-factor authentication
  @Property({ default: false })
  twoFactorEnabled: boolean = false;

  @Property({ nullable: true, columnType: 'text' })
  twoFactorSecret?: string;

  @Property({ nullable: true, columnType: 'text' })
  backupCodes?: string; // JSON array of backup codes

  // Privacy settings
  @Enum(() => ProfileVisibility)
  profileVisibility: ProfileVisibility = ProfileVisibility.PUBLIC;

  @Enum(() => StatusVisibility)
  statusVisibility: StatusVisibility = StatusVisibility.FRIENDS;

  @Enum(() => MatchHistoryVisibility)
  matchHistoryVisibility: MatchHistoryVisibility = MatchHistoryVisibility.FRIENDS;

  // Timestamps
  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;


  @Property({ nullable: true })
  lastLogin?: Date;

  // Relationships
  @OneToMany(() => UserStatistics, (stats) => stats.user)
  statistics = new Collection<UserStatistics>(this);

  @OneToMany(() => MatchHistory, (match) => match.user)
  matchHistory = new Collection<MatchHistory>(this);

  @OneToMany(() => UsernameHistory, (history) => history.user)
  usernameHistory = new Collection<UsernameHistory>(this);

  @OneToMany(() => UserSessions, (session) => session.user)
  sessions = new Collection<UserSessions>(this);


  @OneToMany(() => UserPreferences, (preferences: any) => preferences.user)
  preferences = new Collection<UserPreferences>(this);

  // Helper methods for business logic
  isOnline(): boolean {
    return this.onlineStatus === OnlineStatus.ONLINE;
  }

  isInGame(): boolean {
    return this.onlineStatus === OnlineStatus.IN_GAME;
  }

  canReceiveFriendRequests(): boolean {
    return !this.isLocked && this.profileVisibility !== ProfileVisibility.PRIVATE;
  }

  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.displayName || this.username;
  }

  isAccountLocked(): boolean {
    return this.isLocked || (this.lockedUntil ? this.lockedUntil > new Date() : false);
  }
}