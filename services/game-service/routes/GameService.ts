import { GameEngine } from "../engine/GameEngine";
import { GameWebSocketServer } from "../types/GameWebsocketServer";
import { GameMode, } from "../types/types"
import { Game, Player, Tournament  } from "../types/interfaces";
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
		this.gameEngine.declareWinner = async (game: Game, playerId: string) => {
			this.webSocketServer.winnerAnnounce(game, playerId)
			//place holder for sending match result to user management
			if (this.gameMode === 'tournament'){
				// For tournament matches, get tournament info
				if (this.gameEngine instanceof TournamentPong) {
					// tournament logic (updates tournament status)
					this.tournamentHandling(game, playerId)
					//check if this is the final winner (after tournamentHandling updates status)
					const tournament = this.gameEngine.getTournament(game.id)
					const isFinalWinner = tournament?.status === 'finished' && tournament?.winner?.id === playerId
					// Wait for match history to be saved before posting hash
					await this.sendDataToUMS(game, playerId, tournament?.id, isFinalWinner)
					
					// Only post hash after match history is saved
					if (isFinalWinner && tournament) {
						// Add a small delay to ensure database transaction is committed
						await new Promise(resolve => setTimeout(resolve, 500))
						this.postHash(tournament)
					}
				} else {
					await this.sendDataToUMS(game, playerId)
				}
				
			} else {
				// For classic matches
				await this.sendDataToUMS(game, playerId)
			}
		}

		this.webSocketServer.onPaddleMove = (gameId: string, playerId: string, deltaY: number) =>{
			this.gameEngine.updatePlayerPaddle(gameId, playerId, deltaY)
		}
		this.webSocketServer.clientReady = (gameId: string | undefined, playerId: string, tournamentId?: string) => {
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
			if (gameId && this.gameEngine.allPlayerReady(gameId, playerId)){
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
			else if (this.gameEngine instanceof TournamentPong && game === undefined &&
					this.gameEngine.findPlayerInTournamnet(playerId)){
					const tournamentId = this.gameEngine.findPlayerInTournamnet(playerId)
					if (this.webSocketServer.clientReady){
						let unde: string | undefined
						this.webSocketServer.clientReady(unde, playerId, tournamentId)
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
			this.webSocketServer.winnerAnnounce(game, playerId)
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
					this.postHash(tournament)
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

	// Helper method to convert tournament ID string to integer
	private convertTournamentIdToInt(tournamentId: string): number {
		// If it's already numeric, use it
		if (/^\d+$/.test(tournamentId)) {
			return parseInt(tournamentId);
		}
		// Otherwise, create a hash from the string
		let hash = 0;
		for (let i = 0; i < tournamentId.length; i++) {
			const char = tournamentId.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}

	private async sendDataToUMS(game: Game, winnerId: string, tournamentId?: string, isTournamentWinner?: boolean){

		const data1: {
			userId: number;
			opponentId: number;
			result: string;
			userScore: number;
			opponentScore: number;
			playedAt: string;
			tournamentId?: number;
			tournamentWon?: boolean;
		} = {
			userId: parseInt(game.player1.id),
			opponentId:  parseInt(game.player2.id),
			result: game.player1.id == winnerId ? "win" : "loss",
			userScore: game.player1.score,
			opponentScore: game.player2.score,
			playedAt: new Date().toISOString()
		}

		// Only include tournamentId if it exists
		if (tournamentId) {
			data1.tournamentId = this.convertTournamentIdToInt(tournamentId);
		}
		
		// Only include tournamentWon if it's explicitly true
		if (isTournamentWinner && game.player1.id === winnerId) {
			data1.tournamentWon = true;
		}

		console.log("data1",data1)
		const response1 = await this.postToUMS(data1)
		console.log(response1)

		const data2: {
			userId: number;
			opponentId: number;
			result: string;
			userScore: number;
			opponentScore: number;
			playedAt: string;
			tournamentId?: number;
			tournamentWon?: boolean;
		} = {
			userId: parseInt(game.player2.id),
			opponentId: parseInt(game.player1.id),
			result: game.player2.id == winnerId ? "win" : "loss",
			userScore: game.player2.score,
			opponentScore: game.player1.score,
			playedAt: new Date().toISOString()
		}

		// Only include tournamentId if it exists
		if (tournamentId) {
			data2.tournamentId = this.convertTournamentIdToInt(tournamentId);
		}
		
		// Only include tournamentWon if it's explicitly true
		if (isTournamentWinner && game.player2.id === winnerId) {
			data2.tournamentWon = true;
		}

		console.log("data2", data2)
		const response2 = await this.postToUMS(data2)
		console.log("response2", response2)
		
	}


	private async postToUMS(data: any){
		try {
			const response1 = await fetch("http://user-service:8000/match-history", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					'X-Service-Token': process.env.MATCH_HISTORY_SERVICE_TOKEN ?? '',
				},
				body: JSON.stringify(data)
			})
			if (!response1.ok) {
				const errorText = await response1.text();
				console.error('match history failed', response1.status, errorText);
				// Try to parse as JSON to see the actual error details
				try {
					const errorJson = JSON.parse(errorText);
					console.error('Error details:', JSON.stringify(errorJson, null, 2));
				} catch (e) {
					console.error('Error text (not JSON):', errorText);
				}
			} else {
				const responseData = await response1.json();
				console.log("Match history sent successfully:", response1.status, responseData);
			}
			return response1;
		} catch (error) {
			console.log("Error sending match history:", error)
			throw error;
		}
	}


	private async postHash(tournament: Tournament){

		if (!tournament.winner) {
			console.error('Cannot post hash: tournament has no winner');
			return;
		}
	
		// Get all participant IDs from tournament players
		const participantIds = tournament.players.map(player => parseInt(player.id));
		
		// Get final score from the winner's final match
		// We need to find the final match - it should be the last match in the bracket
		const finalMatch = tournament.bracket
			.filter(match => match.status === 'finished')
			.sort((a, b) => {
				// Sort by match ID to get the last one (assuming IDs are sequential)
				return a.id.localeCompare(b.id);
			})
			.pop();
		
		const finalScore = finalMatch?.winner?.score || 0;

		// Convert tournament ID using the same method
		const tournamentIdInt = this.convertTournamentIdToInt(tournament.id);

		const data = {
			winnerId: parseInt(tournament.winner.id),
			finalScore: finalScore,
			participantIds: participantIds
		}

		console.log(`Posting tournament ${tournament.id} (as ${tournamentIdInt}) to blockchain:`, data);
		await this.postToBlockChain(data, tournamentIdInt.toString());
	}

	private async postToBlockChain(data: any, tournamentId: string){
	try {
		const response1 = await fetch(`http://user-service:8000/tournaments/${tournamentId}/finalize`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer 1",
			},
			body: JSON.stringify(data)
		})

		if (!response1.ok) {
            const errorText = await response1.text();
            console.error(`Failed to finalize tournament ${tournamentId}:`, response1.status, errorText);
            return;
        }

		const responseData = await response1.json();
        console.log("Tournament finalized on blockchain:", responseData);
        console.log("Blockchain TX Hash:", responseData.blockchainTxHash);
	}
	catch (error) {
		console.log("Error sending tournamnet history:", error)
	}
	}
}

