import { WebSocketServer, WebSocket } from "ws"
import {Game, GAME_WIDTH, Tournament} from "./types"

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
	public clientDisconnect?: (playerId: string) => void

	private setupWebsocketServer(){
		this.wss.on('connection', (ws: WebSocket, req) =>{
			const url = new URL(req.url!, 'http://localhost')
			const playerId = url.searchParams.get('playerId')

			if (playerId) {
				this.connectedClients.set(playerId, ws)
				console.log(`Player ${playerId} connected via WebSocket [Port ${this.wss.options.port}]`)

				ws.on('message', (data:string) =>{
					try {
						const message = JSON.parse(data.toString())
						this.handleClientMessage(playerId, message)
					}
					catch (err){
						console.error('Invalid message from client:', err)
					}
				})

				ws.on('close', () => {
					this.connectedClients.delete(playerId)
					console.log(`Player ${playerId} disconnected`)
					if (this.clientDisconnect)
						this.clientDisconnect(playerId)
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
		else if (message.type === 'disconnect' && this.clientDisconnect){
			console.log(`handleClientmessage: Player ${playerId} explicitly disconnecting from game ${message.gameId}`)
			this.clientDisconnect(playerId)
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
		else
			console.log(`Websocket for player1 ${gameData.player1.id} not found`)

		if (player2Ws) {
			player2Ws.send(messagePlayer2)
			console.log(`Sent game_matched to player2: ${gameData.player2.id}`)
		}
		else
			console.log(`Websocket for player2 ${gameData.player2.id} not found`)
}

	public notifyTournamentReady(tournament: Tournament){
		const message = JSON.stringify({
			gameMode: 'tournament',
			status: 'ready',
			id: tournament.id,
			player1: tournament.players[0],
			player2: tournament.players[1],
			player3: tournament.players[2],
			player4: tournament.players[3]
		})

		for (let player of tournament.players){
			const playerWs = this.connectedClients.get(player.id)
			if (playerWs){
				playerWs.send(message)
				console.log(`Sent tournament data to player: ${player.id}`)
			}
		}
	}

	public notifyTournamentComplete(tournament: Tournament){
		if (!tournament.winner)
			return
		const gameResult = {
			status: 'finished',
			gameMode: 'tournament',
			winner: tournament.winner.id
		}

		const msg = JSON.stringify(gameResult)
		this.sendToPlayer(tournament.winner.id, msg)
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
			opponent:{
				id: gameState.player2.id,
				name: gameState.player2.name,
				Y:  gameState.player2.Y,
				X: GAME_WIDTH - gameState.player2.X,
				score: gameState.player2.score,
				ready: gameState.player2.ready
			},
			ball: {
				x: GAME_WIDTH - gameState.ball.x,
				y: gameState.ball.y,
			}

		})

		const player2State = JSON.stringify({
			status: 'playing',
			player:gameState.player2,
			opponent: gameState.player1,
			ball: gameState.ball
		})

		this.sendToPlayer(gameState.player1.id, player1State)
		this.sendToPlayer(gameState.player2.id, player2State)
	}

	public winnerAnnounce(game: Game, winnerId: string){
		const gameResult = {
			status: 'finished',
			gameMode: game.gameMode,
			player1Score: game.player1.score,
			player2Score: game.player2.score,
			winner: winnerId
		}

		const msg = JSON.stringify(gameResult)
		this.sendToPlayer(game.player1.id, msg)
		this.sendToPlayer(game.player2.id, msg)
	}
}
