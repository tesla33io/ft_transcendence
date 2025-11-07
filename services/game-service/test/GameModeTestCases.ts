import { GameService } from "../routes/GameService";
import { GameServiceManager } from "../routes/GameServiceManager";
import { PlayerQueueManager } from "../routes/PlayerQueueManager";
import { JoinGameRequest, Player , Game, User} from "../types/interfaces";
import { createUser, GameMode, generateBallPos, generateBot, generateDefaultGame, generateDefaultPlayer, generateGameId } from "../types/types";


export class GameModeTestCases {
	constructor (
		private queueManager: PlayerQueueManager,
		private gameServiceManager: GameServiceManager ){}

	public async botInspect(playerData: JoinGameRequest){

	}

	public async multipleBotInstance(playerData: JoinGameRequest){
		const gameMode: GameMode = 'classic'
		const gameService: GameService = this.gameServiceManager.getGameService(gameMode)
		const gameId: string = generateGameId()

		const botId_1: string = await generateBot("_1", gameId, "easy")
		const botUser1: User = createUser(botId_1, "bot", "")
		const bot_1: Player = generateDefaultPlayer(botUser1)

		const botId_2: string = await generateBot("_2",gameId, "easy")
		const botUser2: User = createUser(botId_2, "bot", "")
		const bot_2: Player = generateDefaultPlayer(botUser2)

		const game: Game = {
			id: gameId,
			gameMode: 'classic',
			status: 'connected',
			player1: bot_1,
			player2: bot_2,
			ball: generateBallPos()
		}

		setTimeout(() => {
			if (gameService) {
				gameService.initializeGame(game)
				gameService.notifyGameMatched(game)
			} else {
				console.error('GameService not initialized!')
			}
		}, 100)
		console.log(`Initialize bot game ${game.id}`)
		return {
			status: 'connected',
			player1: botId_1,
			player2: botId_2,
			gameId: game.id,
			message: `Bot ${botId_1} and bot ${botId_2} are playing`
		}
	}
}
