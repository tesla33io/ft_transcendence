import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';

@Entity()
export class UserStatistics {
  @PrimaryKey()
  id!: number;
  
  @ManyToOne(() => 'User')
  user!: any;

  // Basic game statistics
  @Property({ default: 0 })
  totalGames: number = 0;

  @Property({ default: 0 })
  wins: number = 0;

  @Property({ default: 0 })
  losses: number = 0;

  @Property({ default: 0 })
  draws: number = 0;

  // Performance metrics
  @Property({ default: 0 })
  averageGameDuration: number = 0; // seconds

  @Property({ default: 0 })
  longestGame: number = 0; // seconds

  // Streak tracking
  @Property({ default: 0 })
  bestWinStreak: number = 0;

  // Ranking and rating
  @Property({ default: 1000 })
  currentRating: number = 1000;

  @Property({ default: 1000 })
  highestRating: number = 1000;

  @Property({ default: 0 })
  ratingChange: number = 0;

  // Tournament statistics
  @Property({ default: 0 })
  overallTournamentWon: number = 0;

  @Property({ default: 0 })
  tournamentsParticipated: number = 0;

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
    // This method can be used to update win percentage when needed
  }

  addWin(): void {
    this.wins++;
    this.totalGames++;
    this.updatedAt = new Date();
  }

  addLoss(): void {
    this.losses++;
    this.totalGames++;
    this.updatedAt = new Date();
  }

  addDraw(): void {
    this.draws++;
    this.totalGames++;
    this.updatedAt = new Date();
  }

  updateRating(newRating: number): void {
    this.ratingChange = newRating - this.currentRating;
    this.currentRating = newRating;
    
    if (this.currentRating > this.highestRating) {
      this.highestRating = this.currentRating;
    }
    
    this.updatedAt = new Date();
  }

  addGameDuration(duration: number): void {
    if (this.averageGameDuration === 0) {
      this.averageGameDuration = duration;
    } else {
      this.averageGameDuration = Math.round((this.averageGameDuration + duration) / 2);
    }
    
    if (duration > this.longestGame) {
      this.longestGame = duration;
    }
    
    this.updatedAt = new Date();
  }

  // Tournament statistics methods
  addTournamentParticipation(): void {
    this.tournamentsParticipated++;
    this.updatedAt = new Date();
  }

  addTournamentWin(): void {
    this.overallTournamentWon++;
    this.updatedAt = new Date();
  }

  calculateTournamentWinRate(): number {
    if (this.tournamentsParticipated === 0) return 0;
    return Number(((this.overallTournamentWon / this.tournamentsParticipated) * 100).toFixed(2));
  }
}