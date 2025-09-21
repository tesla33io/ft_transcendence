import { ClassicPong } from "../engine/ClassicPong"
import { Player, generateGameId, Tournament, TournamentMatch, Game, generateBallPos } from "../types/types"

/**
 Maybe TournamentPong will be the extension of the Classicpong
 make the logic to par the winners until there will be
 only one player left
 */

export class TournamentPong extends ClassicPong{
	private activeTournament: Map<string, Tournament> = new Map()
	private gameIdToTournamentId: Map<string, string> = new Map()

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
		if (tournament.bracket.length > 0){
			let games: Game[] = []
			tournament.bracket.forEach(match => {
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

	public bracketWinner(gameId: string, playerId: string){
		const tournamentId = this.findTournamentId(gameId)
		if (tournamentId != undefined){
			const tournament = this.activeTournament.get(tournamentId)
			if (!tournament)
				return
			let bracket = tournament.bracket.find(match => match.player1.id === playerId || match.player2.id === playerId)
			if (!bracket)
				return
			const player = bracket.player1.id === playerId ? bracket.player1 : bracket.player2
			bracket.status = 'finished'
			bracket.winner = player
			console.log("Winner is: ", bracket.winner)
		}
	}

	public pairTheWinners(gameId: string){
		const tournamentId = this.findTournamentId(gameId)
		if(!tournamentId)
			return undefined

		const tournament = this.activeTournament.get(tournamentId)
		if (!tournament)
			return undefined

		const allMatchesFinished = tournament.bracket.every(match => match.status === 'finished')
		if (!allMatchesFinished){
			console.log('Not all matches in current round are finished')
			return undefined
		}

		const winners = tournament.bracket.filter(match => match.winner !== null).map(match => match.winner!)

		console.log(`Round complete. Winner: ${winners}`)

		if (winners.length === 1){
			tournament.status = 'finished'
			tournament.winner = winners[0]
			console.log(`Tournament champion is ${winners[0].id}`)
			return undefined
		}

		const nextRoundBracket = this.generateBracket(tournamentId, winners)
		tournament.bracket = nextRoundBracket

		console.log(`Next round with ${winners.length} players: `, winners)

		return this.createMatchGame(tournamentId)
	}

	public tournamentAllPlayersReady(gameId: string, playerId: string): boolean{
		console.log(`Client sent id: ${gameId}`)
		const tournamentId = this.findTournamentId(gameId)

		if (tournamentId === undefined)
			return false

		const tournament = this.activeTournament.get(tournamentId)
		if (tournament){
			let player = tournament.players.find(player => player.id === playerId)
			if (player)
				player.ready = true
			console.log("list of non ready players: ", tournament.players.filter(player => player.ready === false))
			if (tournament.players.filter(player => player.ready === false).length > 0)
				return false
			else
				return true
		}
		return false
	}

	public tournamentCleanup(tournamentId: string){
		this.activeGames.delete(tournamentId)
		for (const [gameId, tId] of this.gameIdToTournamentId.entries()){
			if (tId === tournamentId)
				this.gameIdToTournamentId.delete(gameId)
		}
	}
}
