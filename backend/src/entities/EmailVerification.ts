import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ properties: ['user'] })
@Index({ properties: ['verificationToken'] })
export class EmailVerification {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property({ length: 255 })
  email!: string;

  @Property({ unique: true, length: 255 })
  verificationToken!: string;

  // Status
  @Property({ default: false })
  isVerified: boolean = false;

  @Property({ nullable: true })
  verifiedAt?: Date;

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
    return !this.isVerified && !this.isExpired();
  }

  verify(): void {
    this.isVerified = true;
    this.verifiedAt = new Date();
  }

  static generateExpirationDate(hoursFromNow: number = 24): Date {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }
}
