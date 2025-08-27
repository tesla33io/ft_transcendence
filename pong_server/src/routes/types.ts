import { WebSocketServer, WebSocket } from "ws";

export interface Player {
		id: string;
		name: string;
}

export interface Game {
		id: string;
		player1: Player;
		player2: Player;
		status: 'waiting' | 'playing' | 'finished';
}

export class GameWebSocketServer{

	private wss: WebSocketServer
	private connectedClients: Map<string, WebSocket>

	constructor(port: number = 8080){
		this.wss = new WebSocketServer({port})
		this.connectedClients = new Map<string, WebSocket>()
		this.setupWebsocketServer()
	}

	private setupWebsocketServer(){
		this.wss.on('connection', (ws: WebSocket, req) =>{
			const url = new URL(req.url!, 'http://localhost')
			const playerId = url.searchParams.get('playerId')
			if (playerId) {
				this.connectedClients.set(playerId, ws)
				console.log(`Player ${playerId} connected via WebSocket`)

				ws.on('close', () => {
					this.connectedClients.delete(playerId)
					console.log(`Player ${playerId} disconnected`)
				})
			}
		})
	}

	public notifyGameMatched(player1Id: string, player2Id: string, gameData: any){
		const player1Ws = this.connectedClients.get(player1Id)
		const player2Ws = this.connectedClients.get(player2Id)

		const messagePlayer1 = JSON.stringify({
			type: 'game_matched',
			...gameData
		})

		const messagePlayer2 = JSON.stringify({
			type: 'game_matched',
			status: 'matched',
			gameId: gameData.gameId,
			player1: gameData.player2,
			player2: gameData.player1
		})

		console.log(gameData)
		if (player1Ws) {
			player1Ws.send(messagePlayer1)
			console.log(`Sent game_matched to player1: ${player1Id}`)
		}
		if (player2Ws) {
			player2Ws.send(messagePlayer2)
			console.log(`Sent game_matched to player2: ${player2Id}`)
		}
	}
}


