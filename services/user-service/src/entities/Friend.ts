import { Entity, PrimaryKey, Property, ManyToOne, Check, Index } from '@mikro-orm/core';
import { User } from './User';

//@Unique({ properties: ['userIdFrom', 'userIdTo'] })
//@Index({ properties: ['userIdFrom'] })
//@Index({ properties: ['userIdTo'] })
@Entity()
@Check({ expression: 'user_id_from != user_id_to' })
@Index({ properties: ['status'] })
export class Friend {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User, { deleteRule: 'cascade' })
    userFrom!: User;

    //@Property()
    //userIdFrom!: number;

    @ManyToOne(() => User, { deleteRule: 'cascade' })
    userTo!: User;

    //@Property()
    //userIdTo!: number;

    @Property({ default: 'pending' })
    status: string = 'pending';

    @Property({ onCreate: () => new Date() })
    createdAt = new Date();

    @Property({ nullable: true })
    acceptedAt?: Date;

    @Property({ default: 1 })
    version: number = 1;
}

