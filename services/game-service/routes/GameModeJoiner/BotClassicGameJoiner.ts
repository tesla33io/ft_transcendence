import {  GameMode } from '../../types/types'
import { GameServiceManager } from '../GameServiceManager'
import { Game, Player, JoinGameRequest } from '../../types/interfaces'
import { generateDefaultPlayer, generateGameId, generateBallPos, generateBot } from '../../types/types'

export class BotClassicGameJoiner {
	constructor (
		private gameServiceManager: GameServiceManager ){}

	public async join(playerData: JoinGameRequest) {
			const { playerName, playerId} = playerData as {playerName: string, playerId: string}
			const gameMode: GameMode = 'classic'
			const gameService = this.gameServiceManager.getGameService(gameMode)
			const player: Player = generateDefaultPlayer(playerName, playerId)
			const gameId: string = generateGameId();

			const botId: string = await generateBot("", gameId, "easy")
			const bot: Player = generateDefaultPlayer("bot", botId)

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
