import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { Game } from "../types/types"

export class GameService{
	private gameEngine: GameEngine
	private webSocketServer: GameWebSocketServer

	constructor(webSocketPort: number = 8080) {
		this.gameEngine = new GameEngine()
		this.webSocketServer = new GameWebSocketServer(webSocketPort)
		this.setupCommunication()
	}

	private setupCommunication(){
		this.gameEngine.onGameStatusUpdate = (game: Game) => {
			this.webSocketServer.sendGameState(game)
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, paddleY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, paddleY)
		}
	}

	public startGame(game: Game){
		this.gameEngine.startGame(game)
	}

	public stopGame(game: Game){
		this.gameEngine.stopGame(game)
	}

	public notifyGameMatched(game: Game){
		this.webSocketServer.notifyGameMatched(game)
	}
}

