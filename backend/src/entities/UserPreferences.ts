import { Entity, PrimaryKey, Property, OneToOne, Index } from '@mikro-orm/core';
import { User } from './User';

// Enums for preference values
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum Language {
  EN = 'en',
  FR = 'fr',
  ES = 'es',
  DE = 'de',
}

@Entity()
@Index({ properties: ['user'] })
export class UserPreferences {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, (user) => user.preferences)
  user!: User;

  // UI preferences
  @Property({ default: Theme.LIGHT })
  theme: Theme = Theme.LIGHT;

  @Property({ default: Language.EN, length: 10 })
  language: Language = Language.EN;

  @Property({ default: 'UTC', length: 50 })
  timezone: string = 'UTC';

  // Game preferences
  @Property({ default: true })
  gameSound: boolean = true;

  @Property({ default: true })
  gameMusic: boolean = true;

  @Property({ default: true })
  gameEffects: boolean = true;

  @Property({ default: false })
  autoReady: boolean = false;

  @Property({ default: true })
  spectatorMode: boolean = true;

  // Notification preferences
  @Property({ default: true })
  emailNotifications: boolean = true;

  @Property({ default: true })
  pushNotifications: boolean = true;

  @Property({ default: true })
  friendRequests: boolean = true;

  @Property({ default: true })
  tournamentNotifications: boolean = true;

  @Property({ default: true })
  matchInvites: boolean = true;

  // Privacy preferences
  @Property({ default: true })
  showOnlineStatus: boolean = true;

  @Property({ default: true })
  showLastSeen: boolean = true;

  @Property({ default: true })
  allowFriendRequests: boolean = true;

  @Property({ default: true })
  publicProfile: boolean = true;

  // Timestamps
  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;

  // Helper methods
  updateTheme(theme: Theme): void {
    this.theme = theme;
    this.updatedAt = new Date();
  }

  updateLanguage(language: Language): void {
    this.language = language;
    this.updatedAt = new Date();
  }

  toggleNotification(type: keyof Pick<UserPreferences, 'emailNotifications' | 'pushNotifications' | 'friendRequests' | 'tournamentNotifications' | 'matchInvites'>): void {
    (this[type] as boolean) = !(this[type] as boolean);
    this.updatedAt = new Date();
  }

  getNotificationSettings() {
    return {
      email: this.emailNotifications,
      push: this.pushNotifications,
      friendRequests: this.friendRequests,
      tournaments: this.tournamentNotifications,
      matches: this.matchInvites,
    };
  }
}
