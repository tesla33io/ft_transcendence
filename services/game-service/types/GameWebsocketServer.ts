import { WebSocketServer } from "ws"
import {Game} from "./types"

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

				this.wss.on('close', () => {
					this.connectedClients.delete(playerId)
					console.log(`Player ${playerId} disconnected`)
				})
			}
		})
	}

	public sendToPlayer(playerId: string, message: any){
		const ws = this.connectedClients.get(playerId)
		if (ws && ws.readyState === WebSocket.OPEN){
			ws.send(JSON.stringify(message))
			return true
		}
		return false
	}

	public notifyGameMatched(gameData: Game){
		const player1Ws = this.connectedClients.get(gameData.player1.id)
		const player2Ws = this.connectedClients.get(gameData.player2.id)

		const messagePlayer1 = JSON.stringify({
			type: 'playing',
			...gameData
		})

		const messagePlayer2 = JSON.stringify({
			type: 'playing',
			status: 'playing',
			id: gameData.id,
			player1: gameData.player2,
			player2: gameData.player1
		})

		console.log(gameData)
		if (player1Ws) {
			player1Ws.send(messagePlayer1)
			console.log(`Sent game_matched to player1: ${gameData.player1.id}`)
		}
		if (player2Ws) {
			player2Ws.send(messagePlayer2)
			console.log(`Sent game_matched to player2: ${gameData.player2.id}`)
		}
	}

	public sendGameState(gameState: Game){
		const player1State = JSON.stringify({
			type: 'game_state',
			status: 'playing',
			id: gameState.id,
			player: gameState.player1,
			opponet:gameState.player2,
			ball: gameState.ball
		})

		const player2State = JSON.stringify({
			type: 'game_state',
			status: 'playing',
			id: gameState.id,
			player:gameState.player2,
			opponet: gameState.player1,
			ball: {
				x: 900 - gameState.ball.x,
				y: gameState.ball.y,
				vx: -gameState.ball.vx,
				vy: gameState.ball.vy
			}
		})

		this.sendToPlayer(gameState.player1.id, player1State)
		this.sendToPlayer(gameState.player2.id, player2State)
	}
}
