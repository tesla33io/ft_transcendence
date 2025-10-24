import {  GameMode } from '../../types/types'
import { GameServiceManager } from '../GameServiceManager'
import { Tournament, Player, JoinGameRequest } from '../../types/interfaces'
import { PlayerQueueManager } from '../PlayerQueueManager'
import { generateDefaultPlayer} from '../../types/types'

export class TournamentGameJoiner {
	private tournamentPlayerLimit = 4

	constructor (
		private queueManager: PlayerQueueManager,
		private gameServiceManager: GameServiceManager) {}

	public async join(playerData: JoinGameRequest) {
			const {playerName, playerId, gameMode} = playerData as {playerName: string, playerId: string, gameMode: GameMode}
			const gameService = this.gameServiceManager.getGameService('tournament')
			const player: Player = generateDefaultPlayer(playerName, playerId)

			const tournamentWaitingPlayer = this.queueManager.getQueue(gameMode)
			tournamentWaitingPlayer.push(player)
			if (tournamentWaitingPlayer.length >= this.tournamentPlayerLimit){
				const players = tournamentWaitingPlayer.splice(0, this.tournamentPlayerLimit)

				setTimeout(() => {
					if (gameService) {
						const tournament: Tournament = gameService.createTournament(players)
						gameService.notifyTournamentReady(tournament)
					} else
						console.error('GameService not initialized!')
				}, 100)

				return {
					status: 'waiting',
					playerId: player.id,
					message: 'Waiting for player...'
				}
			}
			else{
				console.log("Waiting players: ", tournamentWaitingPlayer)
				return {
					status: 'waiting',
					playerId: player.id,
					message: `Waiting for player... (${tournamentWaitingPlayer.length}/${this.tournamentPlayerLimit})`
				}
			}
		}
}
