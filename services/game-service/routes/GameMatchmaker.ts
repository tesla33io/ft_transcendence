import {Player, Game, GameMode, Tournament, JoinGameRequest} from "../types/types"
import {generateDefaultPlayer, generateDefaultGame} from "../types/types"
import { GameServiceManager } from "./GameServiceManager"


export class GameMatchmaker {
	private static instance: GameMatchmaker
	private gameServiceManager: GameServiceManager
	private tournamentPlayerLimit = 4
	private waitingPlayers: Map< GameMode, Player[]> = new Map([
		['classic', []],
		['tournament', []]
	])

	private constructor (serviceManager: GameServiceManager){
		this.gameServiceManager = serviceManager
	}

	public static getInstance(gameServiceManager: GameServiceManager){
		if (!GameMatchmaker.instance)
				GameMatchmaker.instance = new GameMatchmaker(gameServiceManager)
		return GameMatchmaker.instance
	}

	public removePlayerFromQueue(playerId: string, gameMode: GameMode = 'classic'): boolean{
		const waitingList = this.waitingPlayers.get(gameMode)
		if (!waitingList)
			return false

		const playerIndex = waitingList.findIndex(player => player.id === playerId)
		if (playerIndex !== -1){
			waitingList.splice(playerIndex, 1)
			console.log(`Player ${playerId} removed from the ${gameMode} waiting list`)
			return true
		}
		return false
	}

	public async joinClassicGame(playerData: JoinGameRequest) {
		const { playerName, playerId, gameMode } = playerData as { playerName: string, playerId: string, gameMode: GameMode }
		const gameService = this.gameServiceManager.getGameService(gameMode)
		const player: Player = generateDefaultPlayer(playerName, playerId)

		if (!this.waitingPlayers.has(gameMode))
			this.waitingPlayers.set(gameMode, [])

		const ClassicWaitingPlayer = this.waitingPlayers.get(gameMode)!

		if (ClassicWaitingPlayer.length > 0){
			const opponent = ClassicWaitingPlayer.shift()!
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
			ClassicWaitingPlayer.push(player)
			console.log("Waiting players: ", this.waitingPlayers)
			return {
				status: 'waiting',
				playerId: player.id,
				message: 'Waiting for player...'
			}
		}
	}

	public async joinTournament(playerData: JoinGameRequest){
		const {playerName, playerId, gameMode} = playerData as {playerName: string, playerId: string, gameMode: GameMode}
		const gameService = this.gameServiceManager.getGameService('tournament')
		const player: Player = generateDefaultPlayer(playerName, playerId)

		if (!this.waitingPlayers.has(gameMode))
			this.waitingPlayers.set(gameMode, [])

		const tournamentWaitingPlayer = this.waitingPlayers.get(gameMode)!
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
			console.log("Waiting players: ", this.waitingPlayers)
			return {
				status: 'waiting',
				playerId: player.id,
				message: `Waiting for player... (${tournamentWaitingPlayer.length}/${this.tournamentPlayerLimit})`
			}
		}
	}

	public async joinBotClassic(playerData: JoinGameRequest){
		const { playerName, playerId, gameMode } = playerData as {playerName: string, playerId: string, gameMode: GameMode}
		const gameService = this.gameServiceManager.getGameService(gameMode)
		const player: Player = generateDefaultPlayer(playerName, playerId)

		//[TO DO] - need to generate bot from api call
		// the request JSON should have the difficulity of the bot
		// request to aibot service will return the ID of the bot (bot will connect to the server via websocket)

		const response = await fetch ('http://ai-service:5100/api/v1/aibot/get-bot/classic', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({gameId: `${playerId}`, difficulty: 'easy'})
		})

		if (!response.ok){
			throw new Error('Failed to generate bot')
		}

		const data = await response.json()
		const botId = data.botId

		const bot: Player = generateDefaultPlayer("bot", botId as string)
		const game: Game = generateDefaultGame(bot, player)
		setTimeout(() => {
			if (gameService){
				gameService.initializeGame(game)
				gameService.notifyGameMatched(game)
			} else {
				console.error('GameService not Initialized!')
			}
		})

		return {
			status: 'waitting',
			playerId: player.id,
			gameId: game.id,
			message: 'Connecting to game...'
		}
	}
}
