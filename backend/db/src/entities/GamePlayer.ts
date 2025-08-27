import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { Game } from './Game';
import { User } from './User';

@Entity({ tableName: 'game_players' })
export class GamePlayer {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Game)
    //@Index()
    game!: Game;

    @ManyToOne(() => User)
    //@Index()
    user!: User;

    @Property({ default: 0 })
    score: number = 0;

    @Property({ default: 1 })
    team: number = 1;
}
