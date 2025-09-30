import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { Game, GameMode, Player, Tournament } from "../types/types"
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
			this.webSocketServer.winnerAnnounce(game, playerId)
			if (this.gameMode === 'tournament'){
				this.tournamentHandling(game, playerId)
			}
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string, playerId: string, tournamentId?: string) => {

			if (tournamentId && !gameId){
					if (this.gameEngine instanceof TournamentPong &&
						this.gameEngine.tournamentAllPlayersReady(tournamentId, playerId)){
							console.log(`Tournament players are ready: true`)
							const tournament = this.gameEngine.getTournament(tournamentId)
							if (tournament?.status !== 'playing')
								this.startTournament(tournamentId)
							return
					}
				}

			if (this.gameEngine.allPlayerReady(gameId, playerId)){
				console.log(`Classic players are ready: true`)
				this.gameEngine.startGame(gameId)
				return
			}


		}
		this.webSocketServer.clientDisconnect = (playerId: string) => {
			const game = this.gameEngine.findPlayerInGame(playerId)
			if (game !== undefined){
				this.stopGame(game.id);
				const winnerId = playerId === game.player1.id ? game.player2.id : game.player1.id
				this.webSocketServer.winnerAnnounce(game, winnerId)
				if (this.gameEngine instanceof TournamentPong &&
					this.gameEngine.declareWinner){
						this.gameEngine.declareWinner(game, winnerId)
				}
			}
			else{
				if (this.matchmaker)
					this.matchmaker.removePlayerFromQueue(playerId, this.gameMode)
			}
		}
		this.gameEngine.disconnectClient = (playerId: string) => {
			this.webSocketServer.disconnectClient(playerId)
		}
	}

	private tournamentHandling(game: Game, playerId: string){
		if (this.gameEngine instanceof TournamentPong){
			this.gameEngine.bracketWinner(game.id, playerId)
			const tournament = this.gameEngine.getTournament(game.id)
			const nextRoundGames = this.gameEngine.pairTheWinners(game.id)

			if (nextRoundGames && nextRoundGames.length > 0){
				this.webSocketServer.notifyTournamentReady(tournament!)
				console.log(`Started next tournament round with ${nextRoundGames.length} games`)
			}
			else if (this.gameEngine instanceof TournamentPong) {
				if (tournament?.status === 'finished'){
					console.log(`Tournament ${tournament.id} completed`)
					this.webSocketServer.notifyTournamentComplete(tournament)
				}
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

	public startTournament(tournamentId: string){
		console.log(`Tournament start as Tournament Pong: ${this.gameEngine instanceof TournamentPong}`)
		if (this.gameEngine instanceof TournamentPong){
			const tournament = this.gameEngine.getTournament(tournamentId)
			if (tournament?.status === 'playing')
				return
			const games = this.gameEngine.createMatchGame(tournamentId)
			if (games){
				games.forEach(game => {
					this.webSocketServer.notifyGameMatched(game)
				})
			}
		}
	}
}

