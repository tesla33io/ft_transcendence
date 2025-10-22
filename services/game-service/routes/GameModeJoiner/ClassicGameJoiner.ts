import {  GameMode } from '../../types/types'
import { GameServiceManager } from '../GameServiceManager'
import { Game, Player, JoinGameRequest } from '../../types/interfaces'
import { PlayerQueueManager } from '../PlayerQueueManager'
import { generateDefaultPlayer, generateDefaultGame } from '../../types/types'

export class ClassicGameJoiner {
	constructor(
		private queueManager: PlayerQueueManager,
		private gameServiceManager: GameServiceManager
	) {}

	public async join(playerData: JoinGameRequest) {
		const { playerName, playerId, gameMode } = playerData as { playerName: string; playerId: string; gameMode: GameMode }
		const gameService = this.gameServiceManager.getGameService(gameMode)
		const player: Player = generateDefaultPlayer(playerName, playerId)

		const waitingPlayers = this.queueManager.getQueue(gameMode)

		if (waitingPlayers.length > 0) {
			const opponent = waitingPlayers.shift()!
			const game: Game = generateDefaultGame(opponent, player)

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
			}
		}
		else {
			waitingPlayers.push(player)
			console.log('Waiting players:', waitingPlayers)
			return {
				status: 'waiting',
				playerId: player.id,
				message: 'Waiting for player...'
			}
		}
	}
}
