import {Player, Game, GameWebSocketServer} from "./types.js"
import { WebSocketServer } from "ws"

let waitingPlayers: Player[] = []
let activeGame: Game[] = []
let wsServer: GameWebSocketServer

const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15);
}

export function setWebSocketServer(websocketServer: GameWebSocketServer){
	wsServer = websocketServer
}

export async function joinGameHandler(req:any, reply:any) {

	const { playerName } = req.body as { playerName: string }

		const player: Player = {
			id: generateId(),
			name: playerName,
			score: 0,
			paddleY: 0
		};

		console.log(waitingPlayers)

		if (waitingPlayers.length > 0){
			const opponent = waitingPlayers.shift()!
			const game: Game = {
				id: generateId(),
				status: 'playing',
				player1: opponent,
				player2: player,
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
