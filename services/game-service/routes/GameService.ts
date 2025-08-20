import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { Game, GameMode, Player, Tournament } from "../types/types"
import { GameModeEngineProvider } from "../engine/GameEngineProvider";
import { GameMatchmaker } from "./GameMatchmaker";
import { TournamentPong } from "../engine/TournamentPong";
import { ClassicPong } from "../engine/ClassicPong";

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
			if (this.gameMode === 'tournament' && this.gameEngine instanceof TournamentPong){
				//logic for findding the finnalist
			}
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string, playerId: string) => {
			if (this.gameEngine instanceof ClassicPong && this.gameEngine.allPlayerReady(gameId, playerId)){
				console.log(`Classic players are ready: true`)
				this.gameEngine.startGame(gameId)
			}
			else if (this.gameEngine instanceof TournamentPong){
				const playesReady = this.gameEngine.tournamentAllPlayersReady(gameId, playerId)
				console.log(`Tournament players are ready: ${playesReady}`)
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

	public notifyTournamentReady(tournament: Tournament){
		this.webSocketServer.notifyTournamentReady(tournament)
	}

	public createTournament(players: Player[]) {
		if (this.gameEngine instanceof TournamentPong)
			return this.gameEngine.createTournament(players)
		throw new Error("Game engine is not a TournamentPong");
	}
}

