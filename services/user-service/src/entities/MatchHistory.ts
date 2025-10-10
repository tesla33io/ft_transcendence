import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';

// Enums for match data
export const MatchResult = {
    WIN: 'win',
    LOSS: 'loss',
    DRAW: 'draw',
    FORFEIT: 'forfeit',
    TIMEOUT: 'timeout',
} as const;

export type MatchResult = typeof MatchResult[keyof typeof MatchResult];

@Entity()
export class MatchHistory {
    @PrimaryKey({ type: 'number' })
    id!: number;

    // Match participants
    @ManyToOne(() => 'User')
    user!: any;

    @ManyToOne(() => 'User')
    opponent!: any;

    // Tournament context
    @Property({ type: 'number', nullable: true })
    tournamentId?: number;

    @Property({ type: 'boolean', nullable: true })
    tournamentWon?: boolean;

    // Results
    @Property({ type: 'string' })
    result!: MatchResult;

    @Property({ type: 'number', default: 0 })
    userScore: number = 0;

    @Property({ type: 'number', default: 0 })
    opponentScore: number = 0;

    @Property({ type: 'string', nullable: true, columnType: 'text' })
    blockchainTxHash?: string;

    @Property({ type: 'boolean', default: false })
    onBlockchain: boolean = false;

    // Timing information
    @Property({ type: 'datetime', nullable: true })
    startTime?: Date;

    @Property({ type: 'datetime', nullable: true })
    endTime?: Date;

    @Property({ type: 'datetime' })
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
