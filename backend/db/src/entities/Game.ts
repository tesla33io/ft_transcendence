import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Index } from '@mikro-orm/core';
import { User } from './User';
import { GamePlayer } from './GamePlayer';

@Entity({ tableName: 'games' })
export class Game {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property()
    @Index()
    mode!: string;

    @Property({ onCreate: () => new Date(), fieldName: 'started_at' })
    @Index()
    startedAt: Date = new Date();

    @Property({ nullable: true, fieldName: 'ended_at' })
    endedAt?: Date;

    @Property({ type: 'json', nullable: true })
    result?: Record<string, any>;

    @ManyToOne(() => User, { nullable: true, fieldName: 'created_by' })
    //@Index()
    createdBy?: User;

    @OneToMany(() => GamePlayer, player => player.game)
    players = new Collection<GamePlayer>(this);
}
