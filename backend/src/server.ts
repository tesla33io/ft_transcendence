import { MikroORM } from '@mikro-orm/sqlite';
import mikroOrmConfig from './mikro-orm.config.js';
import { User, UserRole } from './entities/User.js';
import { UserStatistics } from './entities/UserStatistics.js';
import { MatchHistory, MatchResult } from './entities/MatchHistory.js';
import express from 'express';
import { log } from 'console';

// Helper function to log errors
function logError(context: string, error: unknown) {
    console.error('[Error - ${context}]:', error instanceof Error ? error.message : error);
}

//initialize ORM, loading the config file dynamically

async function main() {
    let orm;
    try {
        orm = await MikroORM.init(mikroOrmConfig);
        console.log('ORM initialized:', orm.em); // access EntityManager via 'em' property
        console.log('Schema:', orm.schema); // access SchemaGenerator via 'schema' property
    } catch (error) {
        logError('ORM Initialization', error);
        process.exit(1); // Exit if ORM fails to initialize
    }

    // Fork the EntityManager for scoped operations
    const em = orm.em.fork();

    // create new user entity instance 
    let user;
    try {
        user = new User();
        user.username = 'Foo';
        user.email = 'foo@bar.com';
        user.passwordHash = 'hashed_password';
        user.displayName
        user.avatarUrl = 'http://example.com/avatar.png';
        user.role = UserRole.USER;
        user.isVerified = false;

        // first mark the entity with 'persist()', then 'flush()'
        await em.persistAndFlush(user); // use forked Entity Manager
        // after the entity is flushed, it becomes managed, and has the PK available
        console.log('New user created with ID:', user.id);
    } catch (error) {
        logError('Error creating user:', error);
    }

    // Create user statistics
    try {
        if (!user) {
            throw new Error('User entity was not created successfully.');
        }
        const stats = new UserStatistics();
        stats.user = user; // associate with the created user
        stats.totalGames = 10;
        stats.wins = 7;
        stats.losses = 3;
        stats.winPercentage = 70.0;

        // Persist the statistics
        await em.persistAndFlush(stats); // use forked Entity Manager
        console.log('User statistics created with ID:', stats.id);
    } catch (error) {
        logError('Error creating user statistics:', error);
    }

    // Create Match history 
    try {
        if (!user) {
            throw new Error('User entity was not created successfully.');
        }
        const match = new MatchHistory();
        match.user = user;
        match.opponent = user; // for simplicity, user played against themselves
        match.result = MatchResult.WIN;
        match.userScore = 100;
        match.opponentScore = 50;
        match.playedAt = new Date();

        // Persist the match history
        await em.persistAndFlush(match); // use forked Entity Manager
        console.log('Match history created with ID:', match.id);
    } catch (error) {
        logError('Error creating match history:', error);
    }

    //Query user with Relationships
    try {
        if (!user) {
            throw new Error('User entity was not created successfully.');
        }
        const fetchUser = await em.findOne(User, { id: user.id }, { populate: ['statistics', 'matchHistory'] });
        if (fetchUser) {
            console.log('Fetched User:', fetchUser);
            console.log('Statistics:', fetchUser.statistics);
            console.log('Match History:', fetchUser.matchHistory);
        }
    } catch (error) {
        logError('Error fetching user with relationships:', error);
    }

    // Start the server
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.json());

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