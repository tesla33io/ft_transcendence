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
			if (game.player1.score >= 3 || game.player2.score >= 3 ){
				// this.stopGame(game)
				this.webSocketServer.winnerAnnouce(game)
			}
			else
				this.webSocketServer.sendGameState(game)
		}
		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string, playerId: string) => {
			//add check for readystate of each player in game than start the game
			if (this.gameEngine.allPlayerReady(gameId, playerId))
				this.gameEngine.startGame(gameId)
		}
	}

	public initializeGame(game: Game){
		this.gameEngine.initializeGameState(game)
	}

	public startGame(gameId: string){
		this.gameEngine.startGame(gameId)
	}

	public stopGame(game: Game){
		this.gameEngine.stopGame(game)
	}

	public notifyGameMatched(game: Game){
		this.webSocketServer.notifyGameMatched(game)
	}
}

