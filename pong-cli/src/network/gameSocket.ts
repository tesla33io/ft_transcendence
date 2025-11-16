import Websocket from 'ws'
import { GameBoard } from '../ui/gameBoard'

export class GameWebsocket{
	private static gameId: string
	private static playerId: string
	private static wsUrl: string
	private static ws: Websocket
	private static gameBoard: GameBoard | null = null

	public static async connectToGame(route: string, gameId: string, playerId: string) {
		return new Promise<void>((resolve, reject) => {
			// Create the game board when connecting
			this.gameBoard = new GameBoard()

			this.gameId = gameId
			this.playerId = playerId
			this.wsUrl = `ws://localhost:3000/ws/${route}?playerId=${playerId}`
			this.ws = new Websocket(this.wsUrl)

			this.ws.onopen = () => {
				console.log("Connected to game server!")
				resolve()
			}

			this.ws.onerror = (err) => {
				console.log("WebSocket error", err)
				reject(err)
			}

			this.ws.onclose = () => {
				console.log("Game connection closed.")
				// Destroy the game board when connection closes
				if (this.gameBoard) {
					this.gameBoard.destroy()
					this.gameBoard = null
				}
			}

			this.ws.onmessage = (msg) => {
				try {
					const data = JSON.parse(msg.data.toString())
					this.handleGameEvent(data)
				} catch (err) {
					// console.log("Invalid WS message:", msg.data)
				}
			}
		})
	}

	private static handleGameEvent(event: any) {
		switch (event.type) {
			case "classic_notification":
				if (event.status === 'connected'){
					console.log("Game Connected")
					const readyMsg = this.readyMessage('ready', this.playerId, this.gameId)
					console.log("ready MSg:", readyMsg)
					this.ws.send(JSON.stringify(readyMsg))
				}
				else if (event.status === 'finished'){
					console.log("Game Finished")
				}
			break;

			case "game_state":
				if (event.status === 'playing'){
					if (this.gameBoard) {
						this.gameBoard.renderGameState(event);
					}
				}
				else if (event.status === 'finished'){
					// Clean up game board on finish
					if (this.gameBoard) {
						this.gameBoard.destroy()
						this.gameBoard = null
					}
				}
			break;


			case "MATCH_END":
				console.log("Match ended:", event.result);
			break;

			// default:
			// 	console.log("Unknown event:", event);
		}
	}

	private static readyMessage(type: string, playerId: string, gameId: string){
		const readyMsg = {
			type: 'ready',
			playerId: playerId,
			gameId: gameId
		}
		return readyMsg
	}

}
