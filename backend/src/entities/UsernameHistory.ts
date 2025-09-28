import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ properties: ['user'] })
@Index({ properties: ['changedAt'] })
export class UsernameHistory {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property({ nullable: true, length: 30 })
  oldUsername?: string;

  @Property({ length: 30 })
  newUsername!: string;

  @Property()
  changedAt!: Date;

  @Property({ nullable: true, length: 100 })
  reason?: string;

  @ManyToOne(() => User, { nullable: true })
  changedByUser?: User; // for admin changes

  @Property({ nullable: true, length: 45 })
  ipAddress?: string;

  // Helper methods
  isAdminChange(): boolean {
    return this.changedByUser !== null;
  }

  getChangeDescription(): string {
    if (this.oldUsername && this.newUsername) {
      return `Changed from "${this.oldUsername}" to "${this.newUsername}"`;
    } else if (this.newUsername) {
      return `Set username to "${this.newUsername}"`;
    }
    return 'Username changed';
  }

  getChangeReason(): string {
    return this.reason || 'No reason provided';
  }
}