import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { Game, GameMode, Player } from "../types/types"
import { GameModeEngineProvider } from "../engine/GameEngineProvider";
import { GameMatchmaker } from "./GameMatchmaker";
import { TournamentPong } from "../engine/TournamentPong";

export class GameService{
	private gameEngine: GameEngine
	private webSocketServer: GameWebSocketServer
	private gameMode: GameMode
	private matchmaker: GameMatchmaker

	constructor(matchmaker: GameMatchmaker, gameMode: GameMode, webSocketPort: number = 5005) {
		this.gameMode = gameMode
		this.gameEngine = GameModeEngineProvider.createEngine(this.gameMode)
		this.webSocketServer = new GameWebSocketServer(webSocketPort)
		this.matchmaker = matchmaker
		console.log(`GameService: created socket for game mode ${this.gameMode} on port ${webSocketPort}`)
		this.setupCommunication()
	}

	private setupCommunication(){
		this.gameEngine.onGameStatusUpdate = (game: Game) => {
				this.webSocketServer.sendGameState(game)
		}
		this.gameEngine.declareWinner = (game: Game, playerId: string) => {
			this.webSocketServer.winnerAnnouce(game, playerId)
			if (this.gameMode === 'tournament'){

			}
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string, playerId: string) => {
			if (this.gameMode === 'classic' && this.gameEngine.allPlayerReady(gameId, playerId))
				this.gameEngine.startGame(gameId)
			else if (this.gameEngine instanceof TournamentPong){
				const playesReady = this.gameEngine.tournamentAllPlayersReady(gameId, playerId)
				console.log(`Tournament playes are ready: ${playesReady}`)
			}
		}
		this.webSocketServer.clientDisconnect = (playerId: string) => {
			const game = this.gameEngine.findPlayerInGame(playerId)
			if (game !== undefined){
				this.stopGame(game.id);
				const winnerId = playerId === game.player1.id ? game.player2.id : game.player1.id
				this.webSocketServer.winnerAnnouce(game, winnerId)
			}
			else{
				if (this.matchmaker)
					this.matchmaker.removePlayerFromQueue(playerId, this.gameMode)
			}
		}
	}

	public initializeGame(game: Game){
		this.gameEngine.initializeGameState(game)
	}

	public startGame(gameId: string){
		this.gameEngine.startGame(gameId)
	}

	public stopGame(gameId: string){
		this.gameEngine.stopGame(gameId)
	}

	public notifyGameMatched(game: Game){
		this.webSocketServer.notifyGameMatched(game)
	}

	public createTournament(players: Player[]){
		if (this.gameEngine.createTournament)
			this.gameEngine.createTournament(players)
	}
}

