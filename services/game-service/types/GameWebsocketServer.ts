import { WebSocketServer, WebSocket } from "ws"
import {Game, GAME_WIDTH, GAME_HEIGHT} from "./types"

export class GameWebSocketServer{

	private wss: WebSocketServer
	private connectedClients: Map<string, WebSocket>

	constructor(port: number = 5001){
		this.wss = new WebSocketServer({port})
		this.connectedClients = new Map<string, WebSocket>()
		this.setupWebsocketServer()
		console.log(`Created Server websocket ${port}`)
	}

	public onPaddleMove?: (gameId: string, playerId: string, paddleY: number) => void
	public clientReady?: (gameId: string, playerId: string) => void

	private setupWebsocketServer(){
		this.wss.on('connection', (ws: WebSocket, req) =>{
			const url = new URL(req.url!, 'http://localhost')
			const playerId = url.searchParams.get('playerId')

			if (playerId) {
				this.connectedClients.set(playerId, ws)
				console.log(`Player ${playerId} connected via WebSocket`)

				ws.on('message', (data:string) =>{
					try {
						const message = JSON.parse(data.toString())
						this.handleClientMessage(playerId, message)
					}
					catch (err){
						console.error('Invalid message from client:', err)
					}
				})

				/**
				 * add check when the player disconnect and game already start
				 * then make other player win
				 */
				ws.on('close', () => {
					this.connectedClients.delete(playerId)
					console.log(`Player ${playerId} disconnected`)
				})
			}
		})
	}

	private handleClientMessage(playerId: string, message: any){
		if (message.type === 'paddle_move' && this.onPaddleMove){
			this.onPaddleMove(message.gameId, playerId, message.deltaY)
		}
		else if (message.type === 'ready' && this.clientReady){
			console.log(`Player ${message.playerId} is ready`)
			this.clientReady(message.gameId, message.playerId)
		}
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
			status: 'connected',
			id: gameData.id,
			player1: gameData.player1,
			player2: gameData.player2
		})

		const messagePlayer2 = JSON.stringify({
			status: 'connected',
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

		let player1State = JSON.stringify({
			status: 'playing',
			player: {
				id: gameState.player1.id,
				name: gameState.player1.name,
				Y: gameState.player1.Y,
				X: GAME_WIDTH - gameState.player1.X,
				score: gameState.player1.score,
				ready: gameState.player1.ready
			},
			opponet:{
				id: gameState.player2.id,
				name: gameState.player2.name,
				Y:  gameState.player2.Y,
				X: GAME_WIDTH - gameState.player2.X,
				score: gameState.player2.score,
				ready: gameState.player2.ready
			},
			ball: gameState.ball
		})

		const player2State = JSON.stringify({
			status: 'playing',
			player:gameState.player2,
			opponet: gameState.player1,
			ball: {
				x: GAME_WIDTH - gameState.ball.x,
				y: gameState.ball.y,
			}
		})

		this.sendToPlayer(gameState.player1.id, player1State)
		this.sendToPlayer(gameState.player2.id, player2State)
	}

	public winnerAnnouce(game: Game, winnerId: string){
		let gameResult = {
			status: 'finished',
			player1Score: game.player1.score,
			player2Score: game.player2.score,
			winner: game.player1.id,
		}

		if (game.player2.id === winnerId)
			gameResult["winner"] = game.player2.id

		const msg = JSON.stringify(gameResult)
		this.sendToPlayer(game.player1.id, msg)
		this.sendToPlayer(game.player2.id, msg)
	}
}
