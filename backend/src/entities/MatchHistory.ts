import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

// Enums for match data
export enum GameType {
  ONE_VS_ONE = '1v1',
  TOURNAMENT = 'tournament',
  PRACTICE = 'practice',
  RANKED = 'ranked',
}

export enum GameMode {
  CLASSIC = 'classic',
  SPEED = 'speed',
  POWER_UP = 'power_up',
  CUSTOM = 'custom',
}

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum MatchResult {
  WIN = 'win',
  LOSS = 'loss',
  DRAW = 'draw',
  FORFEIT = 'forfeit',
  TIMEOUT = 'timeout',
}

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum MatchVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
  HIDDEN = 'hidden',
}

@Entity()
@Index({ properties: ['user'] })
@Index({ properties: ['opponent'] })
@Index({ properties: ['playedAt'] })
@Index({ properties: ['tournamentId'] })
@Index({ properties: ['result'] })
@Index({ properties: ['user', 'playedAt'] })
export class MatchHistory {
  @PrimaryKey()
  id!: number;

  // Match participants
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => User)
  opponent!: User;

  // Tournament context
  @Property({ nullable: true })
  tournamentId?: number;

  @Property({ nullable: true, length: 50 })
  tournamentRound?: string;

  @Property({ nullable: true, length: 30 })
  tournamentMatchType?: string;

  // Game details
  @Property({ default: GameType.ONE_VS_ONE })
  gameType: GameType = GameType.ONE_VS_ONE;

  @Property({ default: GameMode.CLASSIC, length: 30 })
  gameMode: GameMode = GameMode.CLASSIC;

  @Property({ default: DifficultyLevel.NORMAL, length: 20 })
  difficultyLevel: DifficultyLevel = DifficultyLevel.NORMAL;

  // Results
  @Property()
  result!: MatchResult;

  @Property({ default: 0 })
  userScore: number = 0;

  @Property({ default: 0 })
  opponentScore: number = 0;

  // Timing information
  @Property({ nullable: true })
  gameDuration?: number; // seconds

  @Property({ nullable: true })
  startTime?: Date;

  @Property({ nullable: true })
  endTime?: Date;

  @Property()
  playedAt!: Date;

  // Detailed game data
  @Property({ nullable: true, columnType: 'text' })
  gameDetails?: string; // JSON with detailed game information

  @Property({ nullable: true, columnType: 'text' })
  replayData?: string; // Base64 encoded replay data

  // Technical details
  @Property({ default: Platform.WEB, length: 20 })
  platform: Platform = Platform.WEB;

  @Property({ nullable: true, length: 20 })
  gameVersion?: string;

  @Property({ nullable: true, length: 20 })
  connectionQuality?: ConnectionQuality;

  // Metadata
  @Property({ default: true })
  isRanked: boolean = true;

  @Property({ default: true })
  isValid: boolean = true; // for disputed/cancelled matches

  @Property({ nullable: true, columnType: 'text' })
  notes?: string;

  // Privacy
  @Property({ default: MatchVisibility.PUBLIC })
  visibility: MatchVisibility = MatchVisibility.PUBLIC;

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

  getDurationInMinutes(): number {
    if (!this.gameDuration) return 0;
    return Math.round(this.gameDuration / 60);
  }

  isQuickGame(): boolean {
    return this.gameDuration ? this.gameDuration < 120 : false; // under 2 minutes
  }

  isLongGame(): boolean {
    return this.gameDuration ? this.gameDuration > 1800 : false; // over 30 minutes
  }

  setGameDetails(details: any): void {
    this.gameDetails = JSON.stringify(details);
  }

  getGameDetails(): any {
    if (!this.gameDetails) return null;
    try {
      return JSON.parse(this.gameDetails);
    } catch {
      return null;
    }
  }

  setReplayData(data: string): void {
    this.replayData = data;
  }

  getReplayData(): string | null {
    return this.replayData || null;
  }
}