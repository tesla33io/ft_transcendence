import { MikroORM } from '@mikro-orm/sqlite';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import bcrypt from 'bcrypt';

// Test entities matching the cleaned schema
@Entity()
class TestUser {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ unique: true, length: 30, type: 'string' })
  username!: string;

  @Property({ type: 'string' })
  passwordHash!: string;

  @Property({ nullable: true, columnType: 'text', type: 'string' })
  avatarUrl?: string;

  @Property({ type: 'string' })
  onlineStatus!: string;

  @Property({ nullable: true, length: 50, type: 'string' })
  activityType?: string;

  @Property({ type: 'string' })
  role!: string;

  @Property({ type: 'boolean' })
  twoFactorEnabled!: boolean;

  @Property({ nullable: true, columnType: 'text', type: 'string' })
  twoFactorSecret?: string;

  @Property({ nullable: true, columnType: 'text', type: 'string' })
  backupCodes?: string;

  @Property({ nullable: true, type: 'Date' })
  lastLogin?: Date;

  @OneToMany(() => TestUserStatistics, stats => stats.user)
  statistics = new Collection<TestUserStatistics>(this);

  @OneToMany(() => TestMatchHistory, match => match.user)
  matchHistory = new Collection<TestMatchHistory>(this);

  constructor() {
    this.role = 'user';
    this.onlineStatus = 'offline';
    this.twoFactorEnabled = false;
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 10);
  }

  isOnline(): boolean {
    return this.onlineStatus === 'online';
  }

  isInGame(): boolean {
    return this.onlineStatus === 'in_game';
  }
}

@Entity()
class TestUserStatistics {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @ManyToOne(() => TestUser)
  user!: TestUser;

  @Property({ type: 'number' })
  totalGames!: number;

  @Property({ type: 'number' })
  wins!: number;

  @Property({ type: 'number' })
  losses!: number;

  @Property({ type: 'number' })
  draws!: number;

  @Property({ type: 'number' })
  averageGameDuration!: number;

  @Property({ type: 'number' })
  longestGame!: number;

  @Property({ type: 'number' })
  bestWinStreak!: number;

  @Property({ type: 'number' })
  currentRating!: number;

  @Property({ type: 'number' })
  highestRating!: number;

  @Property({ type: 'number' })
  ratingChange!: number;

  @Property({ type: 'Date' })
  createdAt!: Date;

  @Property({ type: 'Date' })
  updatedAt!: Date;

  @Property({ nullable: true, type: 'Date' })
  lastGameAt?: Date;

  constructor() {
    this.totalGames = 0;
    this.wins = 0;
    this.losses = 0;
    this.draws = 0;
    this.averageGameDuration = 0;
    this.longestGame = 0;
    this.bestWinStreak = 0;
    this.currentRating = 1000;
    this.highestRating = 1000;
    this.ratingChange = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  calculateWinPercentage(): number {
    if (this.totalGames === 0) return 0;
    return Number(((this.wins / this.totalGames) * 100).toFixed(2));
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
}

@Entity()
class TestMatchHistory {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @ManyToOne(() => TestUser)
  user!: TestUser;

  @ManyToOne(() => TestUser)
  opponent!: TestUser;

  @Property({ nullable: true, type: 'number' })
  tournamentId?: number;

  @Property({ nullable: true, type: 'boolean' })
  tournamentWon?: boolean;

  @Property({ type: 'string' })
  result!: string;

  @Property({ type: 'number' })
  userScore!: number;

  @Property({ type: 'number' })
  opponentScore!: number;

  @Property({ nullable: true, type: 'Date' })
  startTime?: Date;

  @Property({ nullable: true, type: 'Date' })
  endTime?: Date;

  @Property({ type: 'Date' })
  playedAt!: Date;

  constructor() {
    this.userScore = 0;
    this.opponentScore = 0;
    this.playedAt = new Date();
  }

  isWin(): boolean {
    return this.result === 'win';
  }

  isLoss(): boolean {
    return this.result === 'loss';
  }

  isDraw(): boolean {
    return this.result === 'draw';
  }

  getScoreDifference(): number {
    return this.userScore - this.opponentScore;
  }
}

describe('User Management Schema Tests (Cleaned)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [TestUser, TestUserStatistics, TestMatchHistory],
      debug: false,
    });

    await orm.schema.createSchema();
  });

  afterAll(async () => {
    if (orm) {
      await orm.close();
    }
  });

  beforeEach(async () => {
    if (orm) {
      await orm.schema.dropSchema();
      await orm.schema.createSchema();
    }
  });

  describe('User Entity Tests', () => {
    test('should create user with correct attributes', async () => {
      const em = orm.em.fork();
      
      const user = new TestUser();
      user.username = 'testuser';
      user.avatarUrl = 'transcendence/static/avatar_12345.png';
      user.onlineStatus = 'offline';
      user.activityType = 'not playing';
      user.role = 'user';
      user.twoFactorEnabled = false;
      await user.setPassword('password123');

      await em.persistAndFlush(user);

      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.avatarUrl).toBe('transcendence/static/avatar_12345.png');
      expect(user.onlineStatus).toBe('offline');
      expect(user.activityType).toBe('not playing');
      expect(user.role).toBe('user');
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.lastLogin).toBeUndefined();
    });

    test('should enforce unique username constraint', async () => {
      const em = orm.em.fork();
      
      const user1 = new TestUser();
      user1.username = 'duplicate';
      await user1.setPassword('password123');

      const user2 = new TestUser();
      user2.username = 'duplicate';
      await user2.setPassword('password123');

      await em.persistAndFlush(user1);
      await expect(em.persistAndFlush(user2)).rejects.toThrow();
    });

    test('should handle 2FA setup', async () => {
      const user = new TestUser();
      user.username = 'testuser';
      user.twoFactorEnabled = true;
      user.twoFactorSecret = 'ABCD1234EFGH5678';
      user.backupCodes = '["code1", "code2", "code3"]';
      await user.setPassword('password123');

      expect(user.twoFactorEnabled).toBe(true);
      expect(user.twoFactorSecret).toBe('ABCD1234EFGH5678');
      expect(user.backupCodes).toBe('["code1", "code2", "code3"]');
    });
  });

  describe('UserStatistics Entity Tests', () => {
    test('should create user statistics with correct attributes', async () => {
      const em = orm.em.fork();
      
      const user = new TestUser();
      user.username = 'testuser';
      await user.setPassword('password123');

      await em.persistAndFlush(user);

      const stats = new TestUserStatistics();
      stats.user = user;
      stats.totalGames = 10;
      stats.wins = 7;
      stats.losses = 2;
      stats.draws = 1;
      stats.averageGameDuration = 300; // 5 minutes
      stats.longestGame = 600; // 10 minutes
      stats.bestWinStreak = 5;
      stats.currentRating = 1200;
      stats.highestRating = 1250;
      stats.ratingChange = 50;

      await em.persistAndFlush(stats);

      expect(stats.id).toBeDefined();
      expect(stats.user.id).toBe(user.id);
      expect(stats.totalGames).toBe(10);
      expect(stats.wins).toBe(7);
      expect(stats.losses).toBe(2);
      expect(stats.draws).toBe(1);
      expect(stats.averageGameDuration).toBe(300);
      expect(stats.longestGame).toBe(600);
      expect(stats.bestWinStreak).toBe(5);
      expect(stats.currentRating).toBe(1200);
      expect(stats.highestRating).toBe(1250);
      expect(stats.ratingChange).toBe(50);
    });

    test('should calculate win percentage correctly', async () => {
      const stats = new TestUserStatistics();
      stats.totalGames = 10;
      stats.wins = 7;
      stats.losses = 2;
      stats.draws = 1;

      expect(stats.calculateWinPercentage()).toBe(70);
    });
  });

  describe('MatchHistory Entity Tests', () => {
    test('should create match history with correct attributes', async () => {
      const em = orm.em.fork();
      
      const user1 = new TestUser();
      user1.username = 'player1';
      await user1.setPassword('password123');

      const user2 = new TestUser();
      user2.username = 'player2';
      await user2.setPassword('password123');

      await em.persistAndFlush([user1, user2]);

      const match = new TestMatchHistory();
      match.user = user1;
      match.opponent = user2;
      match.tournamentId = 123;
      match.tournamentWon = true;
      match.result = 'win';
      match.userScore = 100;
      match.opponentScore = 80;
      match.startTime = new Date('2024-01-01T10:00:00Z');
      match.endTime = new Date('2024-01-01T10:05:00Z');
      match.playedAt = new Date('2024-01-01T10:00:00Z');

      await em.persistAndFlush(match);

      expect(match.id).toBeDefined();
      expect(match.user.id).toBe(user1.id);
      expect(match.opponent.id).toBe(user2.id);
      expect(match.tournamentId).toBe(123);
      expect(match.tournamentWon).toBe(true);
      expect(match.result).toBe('win');
      expect(match.userScore).toBe(100);
      expect(match.opponentScore).toBe(80);
      expect(match.getScoreDifference()).toBe(20);
    });

    test('should handle different match results', async () => {
      const match = new TestMatchHistory();
      match.result = 'win';
      expect(match.isWin()).toBe(true);
      expect(match.isLoss()).toBe(false);
      expect(match.isDraw()).toBe(false);

      match.result = 'loss';
      expect(match.isWin()).toBe(false);
      expect(match.isLoss()).toBe(true);
      expect(match.isDraw()).toBe(false);

      match.result = 'draw';
      expect(match.isWin()).toBe(false);
      expect(match.isLoss()).toBe(false);
      expect(match.isDraw()).toBe(true);
    });
  });

  describe('Database Relationships', () => {
    test('should maintain user-statistics relationship', async () => {
      const em = orm.em.fork();
      
      const user = new TestUser();
      user.username = 'testuser';
      await user.setPassword('password123');

      await em.persistAndFlush(user);

      const stats = new TestUserStatistics();
      stats.user = user;
      stats.totalGames = 5;
      stats.wins = 3;
      stats.losses = 2;

      await em.persistAndFlush(stats);

      const fetchedUser = await em.findOne(TestUser, { id: user.id }, { 
        populate: ['statistics'] 
      });

      expect(fetchedUser).toBeDefined();
      expect(fetchedUser!.statistics).toBeDefined();
      expect(fetchedUser!.statistics.getItems()).toHaveLength(1);
      expect(fetchedUser!.statistics.getItems()[0].totalGames).toBe(5);
    });

    test('should maintain user-match history relationship', async () => {
      const em = orm.em.fork();
      
      const user1 = new TestUser();
      user1.username = 'player1';
      await user1.setPassword('password123');

      const user2 = new TestUser();
      user2.username = 'player2';
      await user2.setPassword('password123');

      await em.persistAndFlush([user1, user2]);

      const match = new TestMatchHistory();
      match.user = user1;
      match.opponent = user2;
      match.result = 'win';
      match.userScore = 100;
      match.opponentScore = 80;

      await em.persistAndFlush(match);

      const fetchedUser = await em.findOne(TestUser, { id: user1.id }, { 
        populate: ['matchHistory'] 
      });

      expect(fetchedUser).toBeDefined();
      expect(fetchedUser!.matchHistory).toBeDefined();
      expect(fetchedUser!.matchHistory.getItems()).toHaveLength(1);
      expect(fetchedUser!.matchHistory.getItems()[0].result).toBe('win');
    });
  });
});