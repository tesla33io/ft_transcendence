import {Player, Game, generateGameId, generateBallPos, GameMode} from "../types/types"
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

	public static getinstance(gameServiceManager: GameServiceManager){
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
				status: 'connected',
				player1: opponent,
				player2: player,
				ball: generateBallPos()
			};

			setTimeout(() => {
				if (gameService) {
					gameService.notifyGameMatched(game)
					gameService.initializeGame(game)
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
				message: 'Wating for player...'
			}
		}
	}

	public async joinTournament(playerData:{
		playerName: string,
		playerId: string,
		gameMode?: GameMode
	}){
		const {playerName, playerId, gameMode} = playerData as {playerName: string, playerId: string, gameMode: GameMode}
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

		const tournamentWatingPlayer = this.waitingPlayers.get(gameMode)!

		if (tournamentWatingPlayer.length === this.tournamentPlayerLimit){
			const players = tournamentWatingPlayer.splice(0, 4)


			return {
				status: 'waiting',
				playerId: player.id,
				message: 'Waiting for player...'
			}
		}
		else{
			tournamentWatingPlayer.push(player)
			console.log("Waiting players: ", this.waitingPlayers)
			return {
				status: 'waiting',
				playerId: player.id,
				message: `Waiting for player... (${tournamentWatingPlayer.length}/${this.tournamentPlayerLimit})`
			}
		}
	}
}
