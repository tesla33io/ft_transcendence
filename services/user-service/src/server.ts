import { MikroORM } from '@mikro-orm/sqlite';
import mikroOrmConfig from './mikro-orm.config.js';
import { User, UserRole, OnlineStatus } from './entities/User.js';
import { UserStatistics } from './entities/UserStatistics.js';
import { MatchHistory, MatchResult } from './entities/MatchHistory.js';
import express from 'express';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import { log } from 'console';

// Helper function to log errors
function logError(context: string, error: unknown) {
    console.error(`[Error - ${context}]:`, error instanceof Error ? error.message : error);
}

//initialize ORM, loading the config file dynamically

async function main() {
    let orm;
    try {
        orm = await MikroORM.init(mikroOrmConfig);
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            console.log('ORM initialized:', orm.em);
            console.log('Schema:', orm.schema);
        } else {
            console.log('✅ Database connected successfully');
        }
    } catch (error) {
        logError('ORM Initialization', error);
        process.exit(1); // Exit if ORM fails to initialize
    }

    // Create schema if it doesn't exist (ignore if already exists)
    try {
        await orm.schema.createSchema();
        console.log('Database schema created successfully');
    } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
            console.log('Database schema already exists, continuing...');
        } else {
            logError('Schema Creation', error);
            throw error;
        }
    }

    // Fork the EntityManager for scoped operations
    const em = orm.em.fork();

    // Check if sample data already exists, if not create it
    let user;
    try {
        // Try to find existing sample user first
        user = await em.findOne(User, { username: 'Foo' });
        
        if (!user) {
            // Create sample user only if it doesn't exist
            user = new User();
            user.username = 'Foo';
            user.passwordHash = 'hashed_password';
            user.avatarUrl = 'transcendence/static/avatar_12345.png';
            user.onlineStatus = OnlineStatus.OFFLINE;
            user.activityType = 'not playing';
            user.role = UserRole.USER;
            user.twoFactorEnabled = false;

                await em.persistAndFlush(user);
                console.log(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? 'New sample user created with ID: ' + user.id : '✅ Sample user created');
            } else {
                console.log(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? 'Sample user already exists with ID: ' + user.id : '✅ Sample user already exists');
            }
    } catch (error) {
        logError('Error handling sample user:', error);
    }

    // Create user statistics (only if they don't exist)
    try {
        if (user) {
            // Check if statistics already exist for this user
            const existingStats = await em.findOne(UserStatistics, { user });
            
            if (!existingStats) {
                const stats = new UserStatistics();
                stats.user = user;
                stats.totalGames = 10;
                stats.wins = 7;
                stats.losses = 3;
                stats.draws = 0;
                stats.averageGameDuration = 300; // 5 minutes
                stats.longestGame = 600; // 10 minutes
                stats.bestWinStreak = 5;
                stats.currentRating = 1200;
                stats.highestRating = 1250;
                stats.ratingChange = 50;
                stats.createdAt = new Date();
                stats.updatedAt = new Date();

                    await em.persistAndFlush(stats);
                    console.log('✅ User statistics created');
                } else {
                    console.log('✅ User statistics already exist');
                }
        }
    } catch (error) {
        logError('Error handling user statistics:', error);
    }

    // Create Match history (only if it doesn't exist)
    try {
        if (user) {
            // Check if match history already exists for this user
            const existingMatch = await em.findOne(MatchHistory, { user });
            
            if (!existingMatch) {
                const match = new MatchHistory();
                match.user = user;
                match.opponent = user; // for simplicity, user played against themselves
                match.result = MatchResult.WIN;
                match.userScore = 100;
                match.opponentScore = 50;
                match.tournamentId = 123;
                match.tournamentWon = true;
                match.startTime = new Date('2024-01-01T10:00:00Z');
                match.endTime = new Date('2024-01-01T10:05:00Z');
                match.playedAt = new Date();

                    await em.persistAndFlush(match);
                    console.log('✅ Match history created');
                } else {
                    console.log('✅ Match history already exists');
                }
        }
    } catch (error) {
        logError('Error handling match history:', error);
    }

        // Verify data is working (only if user exists)
        try {
            if (user) {
                const fetchUser = await em.findOne(User, { id: user.id }, { populate: ['statistics', 'matchHistory'] });
                if (fetchUser) {
                    console.log('✅ Database verification successful');
                }
            }
        } catch (error) {
            logError('Error fetching user with relationships:', error);
        }

    // Start the server
    const app = express();
    const port = process.env.PORT || 3002;

    app.use(express.json());

    // Add EntityManager to request
    app.use((req, res, next) => {
        req.em = orm.em.fork();
        next();
    });

    // API routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);

    app.get('/', (req, res) => {
        res.send('Welcome to the ft_transcendence backend!');
    });

    try {
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        logError('Starting Server', error);
    }
}

main().catch(error => {
    logError('Main Function', error);
    process.exit(1);
});