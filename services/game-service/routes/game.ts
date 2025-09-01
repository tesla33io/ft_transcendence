import {Player, Game, generateId as generateGameId, generatePlayerId, generateBallPos} from "../types/types"
import { GameService } from "./GameService"

let waitingPlayers: Player[] = []
let activeGame: Game[] = []
let gameService: GameService

export function setGameService(service: GameService){
	gameService = service
	console.log('GameService set successfully:', !!gameService)
}

export async function joinGameHandler(req:any, reply:any) {
	console.log('joinGameHandler called, gameService exists:', !!gameService)

	const { playerName } = req.body as { playerName: string }
	const { playerId } = req.body as { playerId: string }

		const player: Player = {
			id: playerId,
			name: playerName,
			score: 0,
			paddleY: 0,
			paddlyX: 0
		};

		console.log(waitingPlayers)

		if (waitingPlayers.length > 0){
			const opponent = waitingPlayers.shift()!
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
					// gameService.startGame(game)
				} else {
					console.error('GameService not initialized!')
				}
			}, 100)

			return {
				status: 'connecting',
				playerId: player.id,
				gameId: game.id,
				message: 'Connecting to game...'
			};
		}
		else{
			waitingPlayers.push(player)
			return {
				status: 'waiting',
				playerId: player.id,
				message: 'Wating for player...'
			}
		}
}
