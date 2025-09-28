import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ properties: ['user'] })
@Index({ properties: ['currentRating'] })
@Index({ properties: ['wins'] })
@Index({ properties: ['updatedAt'] })
export class UserStatistics {
  @PrimaryKey()
  id!: number;
  
  @ManyToOne(() => User)
  user!: User;

  // Basic game statistics
  @Property({ default: 0 })
  totalGames: number = 0;

  @Property({ default: 0 })
  wins: number = 0;

  @Property({ default: 0 })
  losses: number = 0;

  @Property({ default: 0 })
  draws: number = 0;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  winPercentage: number = 0.00;

  // Tournament statistics
  @Property({ default: 0 })
  tournamentsPlayed: number = 0;

  @Property({ default: 0 })
  tournamentsWon: number = 0;

  @Property({ default: 0 })
  tournamentFinals: number = 0;

  @Property({ default: 0 })
  tournamentSemifinals: number = 0;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  tournamentWinRate: number = 0.00;

  // Performance metrics
  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  averageScore: number = 0.00;

  @Property({ default: 0 })
  highestScore: number = 0;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  averageOpponentScore: number = 0.00;

  @Property({ default: 0 })
  averageGameDuration: number = 0; // seconds

  @Property({ default: 0 })
  shortestGame: number = 0; // seconds

  @Property({ default: 0 })
  longestGame: number = 0; // seconds

  // Streak tracking
  @Property({ default: 0 })
  currentWinStreak: number = 0;

  @Property({ default: 0 })
  bestWinStreak: number = 0;

  @Property({ default: 0 })
  currentLossStreak: number = 0;

  @Property({ default: 0 })
  worstLossStreak: number = 0;

  // Ranking and rating
  @Property({ default: 1000 })
  currentRating: number = 1000;

  @Property({ default: 1000 })
  highestRating: number = 1000;

  @Property({ default: 0 })
  ratingChangeLastGame: number = 0;

  // Time-based statistics
  @Property({ default: 0 })
  gamesToday: number = 0;

  @Property({ default: 0 })
  gamesThisWeek: number = 0;

  @Property({ default: 0 })
  gamesThisMonth: number = 0;

  @Property({ default: 0 })
  totalPlaytime: number = 0; // seconds

  // Additional metrics
  @Property({ default: 0 })
  perfectGames: number = 0; // games won with max score

  @Property({ default: 0 })
  comebackWins: number = 0; // wins after being behind

  @Property({ default: 0 })
  quickWins: number = 0; // wins under 2 minutes

  // Timestamps
  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;

  @Property({ nullable: true })
  lastGameAt?: Date;

  // Helper methods for business logic
  calculateWinPercentage(): number {
    if (this.totalGames === 0) return 0;
    return Number(((this.wins / this.totalGames) * 100).toFixed(2));
  }

  updateWinPercentage(): void {
    this.winPercentage = this.calculateWinPercentage();
  }

  addWin(): void {
    this.wins++;
    this.totalGames++;
    this.currentWinStreak++;
    this.currentLossStreak = 0;
    
    if (this.currentWinStreak > this.bestWinStreak) {
      this.bestWinStreak = this.currentWinStreak;
    }
    
    this.updateWinPercentage();
    this.updatedAt = new Date();
  }

  addLoss(): void {
    this.losses++;
    this.totalGames++;
    this.currentLossStreak++;
    this.currentWinStreak = 0;
    
    if (this.currentLossStreak > this.worstLossStreak) {
      this.worstLossStreak = this.currentLossStreak;
    }
    
    this.updateWinPercentage();
    this.updatedAt = new Date();
  }

  addDraw(): void {
    this.draws++;
    this.totalGames++;
    this.currentWinStreak = 0;
    this.currentLossStreak = 0;
    this.updateWinPercentage();
    this.updatedAt = new Date();
  }

  updateRating(newRating: number): void {
    this.ratingChangeLastGame = newRating - this.currentRating;
    this.currentRating = newRating;
    
    if (this.currentRating > this.highestRating) {
      this.highestRating = this.currentRating;
    }
    
    this.updatedAt = new Date();
  }

  addGameDuration(duration: number): void {
    this.totalPlaytime += duration;
    
    if (this.averageGameDuration === 0) {
      this.averageGameDuration = duration;
    } else {
      this.averageGameDuration = Math.round((this.averageGameDuration + duration) / 2);
    }
    
    if (this.shortestGame === 0 || duration < this.shortestGame) {
      this.shortestGame = duration;
    }
    
    if (duration > this.longestGame) {
      this.longestGame = duration;
    }
    
    this.updatedAt = new Date();
  }

  resetDailyStats(): void {
    this.gamesToday = 0;
    this.updatedAt = new Date();
  }

  resetWeeklyStats(): void {
    this.gamesThisWeek = 0;
    this.updatedAt = new Date();
  }

  resetMonthlyStats(): void {
    this.gamesThisMonth = 0;
    this.updatedAt = new Date();
  }
}