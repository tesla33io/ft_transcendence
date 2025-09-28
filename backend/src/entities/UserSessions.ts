import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ properties: ['user'] })
@Index({ properties: ['sessionToken'] })
@Index({ properties: ['expiresAt'] })
@Index({ properties: ['isActive'] })
export class UserSessions {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property({ unique: true, length: 255 })
  sessionToken!: string;

  @Property({ nullable: true, unique: true, length: 255 })
  refreshToken?: string;

  @Property({ nullable: true, length: 45 })
  ipAddress?: string;

  @Property({ nullable: true, columnType: 'text' })
  userAgent?: string;

  @Property({ nullable: true, length: 50 })
  deviceType?: string;

  @Property({ nullable: true, length: 100 })
  location?: string;

  // Session status
  @Property({ default: true })
  isActive: boolean = true;

  @Property()
  lastActivity!: Date;

  // Timestamps
  @Property()
  createdAt!: Date;

  @Property()
  expiresAt!: Date;

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  extendSession(additionalMinutes: number = 30): void {
    this.expiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
    this.lastActivity = new Date();
  }

  deactivate(): void {
    this.isActive = false;
  }
}
