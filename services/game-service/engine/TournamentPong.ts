import { ClassicPong } from "../engine/ClassicPong"
import { Player, Tournament, TournamentMatch, Game } from "../types/types"
import { generateGameId, generateBallPos } from "../types/types"

export class TournamentPong extends ClassicPong{
	private activeTournament: Map<string, Tournament> = new Map()
	private gameIdToTournamentId: Map<string, string> = new Map()
	private bracketWinners: Map<string, Player[]> = new Map()

	public createTournament(players: Player[]): Tournament{
		const tournamentId = generateGameId()
		const tournament: Tournament = {
			id: tournamentId,
			status: 'waiting',
			players,
			bracket: this.generateBracket(tournamentId, players),
			winner: null
		}
		this.activeTournament.set(tournamentId, tournament)
		console.log("Tournament:", tournament)
		return tournament
	}

	private generateBracket(tournamentId: string, players: Player[]): TournamentMatch[]{
		let bracket: TournamentMatch[] = []

		for (let i = 0; i < players.length; i+=2 ){
			players[i].ready = false
			players[i + 1].ready = false
			bracket.push({
				id: generateGameId(),
				tournamentId: tournamentId,
				status: 'waiting',
				player1: players[i],
				player2: players[i + 1],
				winner: null
			})
		}
		return bracket
	}


	public createMatchGame(tournamentId: string): Game[] | undefined{
		const tournament = this.activeTournament.get(tournamentId)
		if (!tournament)
			return
		const brackets = tournament.bracket.filter(bracket => bracket.status !== 'finished')
		if (brackets.length > 0){
			let games: Game[] = []
			brackets.forEach(match => {
				match.player1.ready = false
				match.player2.ready = false
				const game: Game = {
					id: match.id,
					status: 'connected',
					gameMode: 'tournament',
					player1: match.player1,
					player2: match.player2,
					ball: generateBallPos()
				}
				match.status = 'playing'
				this.gameIdToTournamentId.set(game.id, tournament.id)
				this.initializeGameState(game)
				games.push(game)
				console.log(`Tournament Match start ${game.player1.id} VS ${game.player2.id}`)
			})
			tournament.status = 'playing'
			return games
		}
	}

	private findTournamentId(gameId: string): string | undefined{
		const tournamentId = this.gameIdToTournamentId.get(gameId)
		return tournamentId
	}

	public getTournament(gameId: string): Tournament | undefined{
		const tournamentId = this.findTournamentId(gameId)
		if (!tournamentId)
			return undefined
		return this.activeTournament.get(tournamentId)
	}

	public bracketWinner(gameId: string, winnerId: string){
		const tournamentId = this.findTournamentId(gameId)
		if (tournamentId != undefined){

			const tournament = this.activeTournament.get(tournamentId)
			if (!tournament)
				return
			let bracket = tournament.bracket.find(match => match.id === gameId)
			if (!bracket)
				return

			const isPlayer1Winner = bracket.player1.id === winnerId;
			const player = isPlayer1Winner ? bracket.player1 : bracket.player2;

			if (this.disconnectClient) {
				const loserId = isPlayer1Winner ? bracket.player2.id : bracket.player1.id;
				this.disconnectClient(loserId);
			}

			bracket.status = 'finished'
			bracket.winner = player
			console.log(`Bracket winner: ${winnerId} game ID: ${gameId} => ${tournamentId}`, bracket)
		}
	}

	public pairTheWinners(gameId: string): Game[] | undefined{
		const tournamentId = this.findTournamentId(gameId)
		if(!tournamentId)
			return undefined

		const tournament = this.activeTournament.get(tournamentId)
		if (!tournament)
			return undefined

		let winner = tournament.bracket.find(match => match.id === gameId)?.winner
		if (winner){
			winner.ready = false
			if (this.bracketWinners.has(tournamentId)){
				this.bracketWinners.get(tournamentId)!.push(winner)
			}
			else{
				this.bracketWinners.set(tournamentId, [winner])
			}
		}

		const allMatchesFinished = tournament.bracket.every(match => match.status === 'finished')
		if (!allMatchesFinished){
			console.log(`Not all matches in current round are finished`, tournament.bracket)
			return undefined
		}

		let winners = this.bracketWinners.get(tournamentId)
		if (winners && winners.length === 1){
			tournament.status = 'finished'
			tournament.winner = winners[0]
			console.log(`Tournament champion is ${winners[0].id}`)
			return undefined
		}

		const nextRoundBracket = this.generateBracket(tournamentId, winners!)
		nextRoundBracket.forEach(bracket => {
			tournament.bracket.push(bracket)
		})
		console.log(`Next round with ${winners!.length} players: `, winners)
		this.bracketWinners.set(tournamentId, [])

		return this.createMatchGame(tournamentId)
	}

	public tournamentAllPlayersReady(tournamentId: string, playerId: string): boolean{
		console.log(`Client sent id: ${tournamentId}`)
		if (tournamentId === undefined)
			return false

		const tournament = this.activeTournament.get(tournamentId)
		if (tournament){
			let player = tournament.players.find(player => player.id === playerId)
			if (player)
				player.ready = true
			console.log(`Player ${player!.id} sent Players ready: `, tournament.players)
			// console.log("list of non ready players: ", tournament.players.filter(player => player.ready === false))
			if (tournament.players.filter(player => player.ready === false).length === 0)
				return true
		}
		return false
	}

	public tournamentCleanup(tournamentId: string): void{
		this.activeGames.delete(tournamentId)
		for (const [gameId, tId] of this.gameIdToTournamentId.entries()){
			if (tId === tournamentId)
				this.gameIdToTournamentId.delete(gameId)
		}
	}
}
