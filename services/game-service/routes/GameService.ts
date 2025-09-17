import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { Game, GameMode } from "../types/types"
import { GameModeEngineProvider } from "../engine/GameEngineProvider";

export class GameService{
	private gameEngine: GameEngine
	private webSocketServer: GameWebSocketServer
	private gameMode: GameMode

	constructor(gameMode: GameMode, webSocketPort: number = 5005) {
		this.gameMode = gameMode
		this.gameEngine = GameModeEngineProvider.createEngine(this.gameMode)
		this.webSocketServer = new GameWebSocketServer(webSocketPort)
		console.log(`Created socket for game mode ${this.gameMode} on port ${webSocketPort}`)
		this.setupCommunication()
	}

	private setupCommunication(){
		this.gameEngine.onGameStatusUpdate = (game: Game) => {
				this.webSocketServer.sendGameState(game)
		}
		this.gameEngine.declareWinner = (game: Game, playerId: string) => {
			this.webSocketServer.winnerAnnouce(game, playerId)
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string, playerId: string) => {
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

