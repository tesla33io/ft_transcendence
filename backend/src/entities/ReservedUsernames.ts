import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ properties: ['username'], options: { collate: 'NOCASE' } })
export class ReservedUsernames {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 30 })
  username!: string;

  @Property({ nullable: true, length: 100 })
  reason?: string;

  @ManyToOne(() => User, { nullable: true })
  reservedByUser?: User;

  @Property()
  createdAt!: Date;

  // Helper methods
  isReservedByAdmin(): boolean {
    return this.reservedByUser !== null;
  }

  getReservationReason(): string {
    return this.reason || 'No reason provided';
  }

  getReservedBy(): string {
    if (this.reservedByUser) {
      return this.reservedByUser.username;
    }
    return 'System';
  }
}
