import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';

// Enums for match data
export enum MatchResult {
  WIN = 'win',
  LOSS = 'loss',
  DRAW = 'draw',
  FORFEIT = 'forfeit',
  TIMEOUT = 'timeout',
}

@Entity()
export class MatchHistory {
  @PrimaryKey()
  id!: number;

  // Match participants
  @ManyToOne(() => 'User')
  user!: any;

  @ManyToOne(() => 'User')
  opponent!: any;

  // Tournament context
  @Property({ nullable: true })
  tournamentId?: number;

  @Property({ nullable: true })
  tournamentWon?: boolean;

  // Results
  @Property()
  result!: MatchResult;

  @Property({ default: 0 })
  userScore: number = 0;

  @Property({ default: 0 })
  opponentScore: number = 0;

  // Timing information
  @Property({ nullable: true })
  startTime?: Date;

  @Property({ nullable: true })
  endTime?: Date;

  @Property()
  playedAt!: Date;

  // Helper methods
  isWin(): boolean {
    return this.result === MatchResult.WIN;
  }

  isLoss(): boolean {
    return this.result === MatchResult.LOSS;
  }

  isDraw(): boolean {
    return this.result === MatchResult.DRAW;
  }

  isForfeit(): boolean {
    return this.result === MatchResult.FORFEIT || this.result === MatchResult.TIMEOUT;
  }

  getScoreDifference(): number {
    return this.userScore - this.opponentScore;
  }

  isCloseGame(): boolean {
    return Math.abs(this.getScoreDifference()) <= 2;
  }

  isBlowout(): boolean {
    return Math.abs(this.getScoreDifference()) >= 10;
  }
}