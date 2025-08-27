import { Database } from './Database';
import { UserService, FriendService, GameService } from './services/index';

// Export everything for use in microservice
export * from './entities/index';
export * from './services/index';
export { Database } from './Database';
export { dbConfig } from './config';

// Main database class that provides everything needed
export class FtDatabase {
    private static instance: FtDatabase;
    private db: Database;

    // Service instances
    public readonly userService: UserService;
    public readonly friendService: FriendService;
    public readonly gameService: GameService;

    private constructor() {
        this.db = Database.getInstance();
        this.userService = new UserService();
        this.friendService = new FriendService();
        this.gameService = new GameService();
    }

    static getInstance(): FtDatabase {
        if (!FtDatabase.instance) {
            FtDatabase.instance = new FtDatabase();
        }
        return FtDatabase.instance;
    }

    async initialize(): Promise<void> {
        await this.db.initialize();
    }

    get em() {
        return this.db.em;
    }

    get orm() {
        return this.db.orm;
    }

    // Direct repository access if needed
    get repositories() {
        return {
            user: this.db.userRepository,
            refreshToken: this.db.refreshTokenRepository,
            recoveryToken: this.db.recoveryTokenRepository,
            friend: this.db.friendRepository,
            auditEvent: this.db.auditEventRepository,
            game: this.db.gameRepository,
            gamePlayer: this.db.gamePlayerRepository,
            tournament: this.db.tournamentRepository,
            tournamentRound: this.db.tournamentRoundRepository
        };
    }

    async close(): Promise<void> {
        await this.db.close();
    }
}

// Example usage function
export async function example() {
    try {
        const gameDb = FtDatabase.getInstance();
        await gameDb.initialize();

        // Create a user
        const user = await gameDb.userService.createUser('testuser', 'password123');
        console.log('Created user:', user.username);

        // Validate user login
        const validatedUser = await gameDb.userService.validateUser('testuser', 'password123');
        console.log('User validated:', validatedUser?.username);

        // Create a game
        const game = await gameDb.gameService.createGame('chess', user.id);
        console.log('Created game:', game.id, game.mode);

        // Add player to game
        const gamePlayer = await gameDb.gameService.addPlayerToGame(game.id, user.id);
        console.log('Added player to game:', gamePlayer.user.username);

        await gameDb.close();
    } catch (error) {
        console.error('Example failed:', error);
    }
}

// Run example if this file is executed directly
//if (import.meta.url === `file://${process.argv[1]}`) {
//    example().catch(console.error);
//}
