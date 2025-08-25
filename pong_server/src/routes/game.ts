import {Player, Game} from "./types.js"
import { WebSocketServer } from "ws"

let waitingPlayers: Player[] = []
let activeGame: Game[] = []
let wss: WebSocketServer
let connectedClients: Map<string, any>

const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15);
}

export function setWebSocketServer(websocketServer: WebSocketServer, clients: Map<string, any>){
	wss = websocketServer
	connectedClients = clients
}


function notifyGameMatched(player1Id: string, player2Id: string, gameData: any) {
    const player1Ws = connectedClients.get(player1Id)
    const player2Ws = connectedClients.get(player2Id)

    const message = JSON.stringify({
        type: 'game_matched',
        ...gameData
    })

    // Send to BOTH players
    if (player1Ws) {
        player1Ws.send(message)
        console.log(`Sent game_matched to player1: ${player1Id}`)
    }
    if (player2Ws) {
        player2Ws.send(message)
        console.log(`Sent game_matched to player2: ${player2Id}`)
    }
}
export async function joinGameHandler(req:any, reply:any) {

	const { playerName } = req.body as { playerName: string }

		const player: Player = {
			id: generateId(),
			name: playerName
		};

		console.log(waitingPlayers)


		if (waitingPlayers.length > 0){
			const opponent = waitingPlayers.shift()!
			const game: Game = {
				id: generateId(),
				player1: opponent,  // opponent was waiting (player1)
				player2: player,    // current player just joined (player2)
				status: 'playing'
			};
			activeGame.push(game)

			const gameData = {
            status: 'matched',
            gameId: game.id,
            player1: opponent,
            player2: player
       		 }
			setTimeout(() => {
				notifyGameMatched(opponent.id, player.id, gameData)
			}, 100)

			return {
				status: 'connecting',
				playerId: player.id,  // ADD THIS - second client needs their ID
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
