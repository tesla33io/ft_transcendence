import {Player, Game, generateId, generatePlayerId, generateBallPos} from "../types/types"
import { GameWebSocketServer } from "../types/GameWebsocketServer"

let waitingPlayers: Player[] = []
let activeGame: Game[] = []
let wsServer: GameWebSocketServer

export function setWebSocketServer(websocketServer: GameWebSocketServer){
	wsServer = websocketServer
}

export async function joinGameHandler(req:any, reply:any) {

	const { playerName } = req.body as { playerName: string }

		const player: Player = {
			id: generatePlayerId(),
			name: playerName,
			score: 0,
			paddleY: 0,
			paddlyX: 0
		};

		console.log(waitingPlayers)

		if (waitingPlayers.length > 0){
			const opponent = waitingPlayers.shift()!
			const game: Game = {
				id: generateId(),
				status: 'playing',
				player1: opponent,
				player2: player,
				ball: generateBallPos()
			};
			activeGame.push(game)

			setTimeout(() => {
				wsServer.notifyGameMatched(game)
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
