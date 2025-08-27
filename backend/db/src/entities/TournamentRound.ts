import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { Tournament } from './Tournament';

@Entity({ tableName: 'tournament_rounds' })
export class TournamentRound {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Tournament)
    //@Index()
    tournament!: Tournament;

    @Property({ fieldName: 'round_number' })
    roundNumber!: number;

    @Property({ type: 'json' })
    pairings!: Record<string, any>;
}
