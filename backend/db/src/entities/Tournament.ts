import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Index } from '@mikro-orm/core';
import { User } from './User';
import { TournamentRound } from './TournamentRound';

@Entity({ tableName: 'tournaments' })
export class Tournament {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property()
    name!: string;

    @ManyToOne(() => User, { nullable: true, fieldName: 'created_by' })
    //@Index()
    createdBy?: User;

    @Property({ nullable: true, fieldName: 'started_at' })
    startedAt?: Date;

    @Property({ nullable: true, fieldName: 'ended_at' })
    endedAt?: Date;

    @Property({ type: 'json', default: '{}' })
    settings: Record<string, any> = {};

    @OneToMany(() => TournamentRound, round => round.tournament)
    rounds = new Collection<TournamentRound>(this);
}
