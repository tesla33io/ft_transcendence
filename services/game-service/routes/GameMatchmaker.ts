import { TournamentPong } from "../engine/TournamentPong"
import {Player, Game, generateGameId, generateBallPos, GameMode, Tournament} from "../types/types"
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

	public async joinClassicGame(playerData:{
		playerName: string,
		playerId: string,
		gameMode?: GameMode
	}) {
		const { playerName, playerId, gameMode } = playerData as { playerName: string, playerId: string, gameMode: GameMode }
		const gameService = this.gameServiceManager.getGameService(gameMode)

		const player: Player = {
			id: playerId,
			name: playerName,
			score: 0,
			Y: 0,
			X: 0,
			ready: false
		};

		if (!this.waitingPlayers.has(gameMode))
			this.waitingPlayers.set(gameMode, [])

		const ClassicWaitingPlayer = this.waitingPlayers.get(gameMode)!

		if (ClassicWaitingPlayer.length > 0){
			const opponent = ClassicWaitingPlayer.shift()!
			const game: Game = {
				id: generateGameId(),
				gameMode: 'classic',
				status: 'connected',
				player1: opponent,
				player2: player,
				ball: generateBallPos()
			};

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

	public async joinTournament(playerData:{
		playerName: string,
		playerId: string,
		gameMode?: GameMode
	}){
		const {playerName, playerId, gameMode} = playerData as {playerName: string, playerId: string, gameMode: GameMode}
		const gameService = this.gameServiceManager.getGameService('tournament')

		const player: Player = {
			id: playerId,
			name: playerName,
			score: 0,
			Y: 0,
			X: 0,
			ready: false

		};

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
}
