import { GameMode, WaitingResponse} from "../types/types"
import { generateDefaultPlayer, generateDefaultGame, generateGameId, generateBallPos} from "../types/types"
import { Player, Game, Tournament, JoinGameRequest } from "../types/interfaces"
import { GameServiceManager } from "./GameServiceManager"
import { PlayerQueueManager} from "./PlayerQueueManager"

export class GameMatchmaker {
	private static instance: GameMatchmaker
	private gameServiceManager: GameServiceManager
	private playerQueueManager: PlayerQueueManager = new PlayerQueueManager();
	private tournamentPlayerLimit = 4

	private constructor (serviceManager: GameServiceManager){
		this.gameServiceManager = serviceManager
	}

	public static getInstance(gameServiceManager: GameServiceManager){
		if (!GameMatchmaker.instance)
				GameMatchmaker.instance = new GameMatchmaker(gameServiceManager)
		return GameMatchmaker.instance
	}

	public removePlayerFromQueue(playerId: string, gameMode: GameMode = 'classic'): boolean{
		return this.playerQueueManager.removePlayer(playerId, gameMode)
	}

	public async joinClassicGame(playerData: JoinGameRequest): Promise<WaitingResponse> {
		const { playerName, playerId, gameMode } = playerData as { playerName: string, playerId: string, gameMode: GameMode }
		const gameService = this.gameServiceManager.getGameService(gameMode)
		const player: Player = generateDefaultPlayer(playerName, playerId)

		const classicWaitingPlayer = this.playerQueueManager.getQueue(gameMode)
		if (classicWaitingPlayer.length > 0){
			const opponent = classicWaitingPlayer.shift()!
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
			};
		}
		else{
			classicWaitingPlayer.push(player)
			console.log("Waiting players: ", classicWaitingPlayer)
			return {
				status: 'waiting',
				playerId: player.id,
				message: 'Waiting for player...'
			}
		}
	}

	public async joinTournament(playerData: JoinGameRequest): Promise<WaitingResponse> {
		const {playerName, playerId, gameMode} = playerData as {playerName: string, playerId: string, gameMode: GameMode}
		const gameService = this.gameServiceManager.getGameService('tournament')
		const player: Player = generateDefaultPlayer(playerName, playerId)

		const tournamentWaitingPlayer = this.playerQueueManager.getQueue(gameMode)
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

	public async joinBotClassic(playerData: JoinGameRequest): Promise<WaitingResponse> {
		const { playerName, playerId} = playerData as {playerName: string, playerId: string}
		const gameMode: GameMode = 'classic'
		const gameService = this.gameServiceManager.getGameService(gameMode)
		const player: Player = generateDefaultPlayer(playerName, playerId)
		const gameId: string = generateGameId();

		const response = await fetch ('http://ai-service:5100/api/v1/aibot/get-bot/classic', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({gameId: `${gameId}`, difficulty: 'easy'})
		})

		if (!response.ok){
			throw new Error('Failed to generate bot')
		}

		const data = await response.json()
		const botId: string = data.botId
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
