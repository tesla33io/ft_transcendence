import { QueryOrder } from '@mikro-orm/core';
import { Game, GamePlayer, User } from '../entities/index';
import { Database } from '../Database';

export class GameService {
    private db = Database.getInstance();

    async createGame(mode: string, createdById?: number): Promise<Game> {
        const em = this.db.em;

        const game = new Game();
        game.mode = mode;

        if (createdById) {
            const creator = await em.getReference(User, createdById);
            game.createdBy = creator;
        }

        await em.persistAndFlush(game);
        return game;
    }

    async addPlayerToGame(gameId: number, userId: number, team: number = 1): Promise<GamePlayer> {
        const em = this.db.em;

        // Check if game exists and is not ended
        const game = await em.findOne(Game, { id: gameId });
    if (!game) {
        throw new Error('Game not found');
    }

    if (game.endedAt) {
        throw new Error('Cannot add player to ended game');
    }

    // Check if player is already in the game
    const existingPlayer = await em.findOne(GamePlayer, { game: gameId, user: userId });
if (existingPlayer) {
    throw new Error('Player already in game');
}

const user = await em.getReference(User, userId);
const gamePlayer = new GamePlayer();
gamePlayer.game = game;
gamePlayer.user = user;
gamePlayer.team = team;

await em.persistAndFlush(gamePlayer);
return gamePlayer;
    }

    async updatePlayerScore(gameId: number, userId: number, score: number): Promise<GamePlayer | null> {
        const em = this.db.em;

        const gamePlayer = await em.findOne(GamePlayer, { game: gameId, user: userId });
        if (!gamePlayer) {
            return null;
        }

        gamePlayer.score = score;
        await em.flush();
        return gamePlayer;
    }

    async endGame(gameId: number, result: Record<string, any>): Promise<Game | null> {
        const em = this.db.em;

        const game = await em.findOne(Game, { id: gameId });
        if (!game) {
            return null;
        }

        game.endedAt = new Date();
        game.result = result;
        await em.flush();

        return game;
    }

    async getGameById(gameId: number): Promise<Game | null> {
        const em = this.db.em;

        return await em.findOne(Game, { id: gameId }, {
            populate: ['createdBy', 'players.user']
        });
    }

    async getGamesByUser(userId: number): Promise<Game[]> {
        const em = this.db.em;

        // Find games where user is a player or creator
        const gamesAsPlayer = await em.find(GamePlayer, { user: userId }, {
            populate: ['game.createdBy', 'game.players.user']
        });

        const gamesAsCreator = await em.find(Game, { createdBy: userId }, {
            populate: ['createdBy', 'players.user']
        });

        // Combine and deduplicate
        const allGames = new Map<number, Game>();

        gamesAsPlayer.forEach(gp => allGames.set(gp.game.id, gp.game));
        gamesAsCreator.forEach(game => allGames.set(game.id, game));

        return Array.from(allGames.values()).sort((a, b) => 
                                                  b.startedAt.getTime() - a.startedAt.getTime()
                                                 );
    }

    async getActiveGames(): Promise<Game[]> {
        const em = this.db.em;

        return await em.find(Game, { endedAt: null }, {
            populate: ['createdBy', 'players.user'],
            orderBy: { startedAt: QueryOrder.DESC }
        });
    }

    async getGameStats(userId: number): Promise<Record<string, any>> {
        const em = this.db.em;

        const playerGames = await em.find(GamePlayer, { user: userId }, {
            populate: ['game']
        });

        const totalGames = playerGames.length;
        const completedGames = playerGames.filter(gp => gp.game.endedAt).length;
        const totalScore = playerGames.reduce((sum, gp) => sum + gp.score, 0);
        const avgScore = totalGames > 0 ? totalScore / totalGames : 0;

        return {
            totalGames,
            completedGames,
            totalScore,
            averageScore: Math.round(avgScore * 100) / 100
        };
    }
}
