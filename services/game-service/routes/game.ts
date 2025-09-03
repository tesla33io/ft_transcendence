import {Player, Game, generateId as generateGameId, generateBallPos, GameMode} from "../types/types"
import { GameService } from "./GameService"
import { GameServiceManager } from "./GameServiceManager"

let waitingPlayers: Map< GameMode, Player[]> = new Map([
	['classic', []],
	['tournament', []]
])
let activeGame: Game[] = []
let gameServiceManager: GameServiceManager
// let gameService: GameService

export function setGameServiceManager(serviceManager: GameServiceManager){
	gameServiceManager = serviceManager
	console.log('GameService set successfully:', !!GameServiceManager)
}

export async function joinGameHandler(req:any, reply:any) {
	// console.log('joinGameHandler called, gameService exists:', !!gameService)

	const { playerName, playerId } = req.body as { playerName: string, playerId: string }
	const { gameMode } = req.body as {gameMode: GameMode}
	const gameService = gameServiceManager.getGameService(gameMode)

	const player: Player = {
		id: playerId,
		name: playerName,
		score: 0,
		paddleY: 0,
		paddlyX: 0,
		ready: false
	};

		console.log(waitingPlayers)

		if (!waitingPlayers.has(gameMode))
			waitingPlayers.set(gameMode, [])

		const gameModeWaitingPlayer = waitingPlayers.get(gameMode)!

		if (gameModeWaitingPlayer.length > 0){
			const opponent = gameModeWaitingPlayer.shift()!
			const game: Game = {
				id: generateGameId(),
				status: 'playing',
				player1: opponent,
				player2: player,
				ball: generateBallPos()
			};
			activeGame.push(game)

			setTimeout(() => {
				if (gameService) {
					gameService.notifyGameMatched(game)
					gameService.initializeGame(game)
					// gameService.startGame(game)
				} else {
					console.error('GameService not initialized!')
				}
			}, 100)

			return {
				status: 'connected',
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
