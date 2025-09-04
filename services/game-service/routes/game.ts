import {Player, Game, generateId as generateGameId, generateBallPos, GameMode} from "../types/types"
import { GameServiceManager } from "./GameServiceManager"


export class GameMatchmaker {
	private static instance: GameMatchmaker
	private waitingPlayers: Map< GameMode, Player[]> = new Map([
		['classic', []],
		['tournament', []]
	])
	private activeGame: Game[] = []
	private gameServiceManager: GameServiceManager

	private constructor (serviceManager: GameServiceManager){
		this.gameServiceManager = serviceManager
	}

	public static getinstance(gameServiceManager: GameServiceManager){
		if (!GameMatchmaker.instance)
				GameMatchmaker.instance = new GameMatchmaker(gameServiceManager)
		return GameMatchmaker.instance
	}

	public async joinGameHandler(playerData:{
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

			// console.log("waiting player list:", this.waitingPlayers)

			if (!this.waitingPlayers.has(gameMode))
				this.waitingPlayers.set(gameMode, [])

			const gameModeWaitingPlayer = this.waitingPlayers.get(gameMode)!

			if (gameModeWaitingPlayer.length > 0){
				const opponent = gameModeWaitingPlayer.shift()!
				const game: Game = {
					id: generateGameId(),
					status: 'playing',
					player1: opponent,
					player2: player,
					ball: generateBallPos()
				};
				this.activeGame.push(game)

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
				gameModeWaitingPlayer.push(player)
				return {
					status: 'waiting',
					playerId: player.id,
					message: 'Wating for player...'
				}
			}
	}

}
