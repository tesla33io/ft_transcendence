import {  createUser, GameMode } from '../../types/types'
import { GameServiceManager } from '../GameServiceManager'
import { Game, Player, JoinGameRequest, User } from '../../types/interfaces'
import { generateDefaultPlayer, generateGameId, generateBallPos, generateBot } from '../../types/types'

export class BotClassicGameJoiner {
	constructor (
		private gameServiceManager: GameServiceManager ){}

	public async join(playerData: JoinGameRequest) {
			const { playerName, playerId, sessionId} = playerData as {playerName: string, playerId: string, sessionId: string}
			const gameMode: GameMode = 'classic'
			const gameService = this.gameServiceManager.getGameService(gameMode)
			const user: User = createUser(playerId, playerName, sessionId)
			const player: Player = generateDefaultPlayer(user)
			const gameId: string = generateGameId();

			const botId: string = await generateBot("", gameId, "easy")
			const botUser: User = createUser(botId, "bot", "")
			const bot: Player = generateDefaultPlayer(botUser)

			const game: Game ={
					id: gameId,
					gameMode: 'classic',
					status: 'connected',
					player1: player,
					player2: bot,
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

			return {
				status: 'waiting',
				playerId: player.id,
				gameId: game.id,
				message: 'Connecting to game...'
			};
		}
}
