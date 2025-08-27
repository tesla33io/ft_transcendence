import { Entity, PrimaryKey, Property, ManyToOne, Index, Unique, Check } from '@mikro-orm/core';
import { User } from './User';

@Entity({ tableName: 'friends' })
@Unique({ properties: ['userFrom', 'userTo'], name: 'unique_friend_pair' })
@Check({ expression: 'user_id_from != user_id_to' })
export class Friend {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => User, { fieldName: 'user_id_from' })
    //@Index()
    userFrom!: User;

    @ManyToOne(() => User, { fieldName: 'user_id_to' })
    //@Index()
    userTo!: User;

    @Property({ default: 'pending' })
    @Index()
    status: string = 'pending';

    @Property({ onCreate: () => new Date(), fieldName: 'created_at' })
    createdAt: Date = new Date();

    @Property({ nullable: true, fieldName: 'accepted_at' })
    acceptedAt?: Date;

    @Property({ default: 1 })
    version: number = 1;
}
