import { ClassicPong } from "../engine/ClassicPong"
import { Player, generateGameId, Tournament, TournamentMatch, Game, generateBallPos } from "../types/types"

/**
 Maybe TournamentPong will be the extention of the Classicpong
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

	//just pair 2 up until last guy standing
	private createRoundMatches(tournamentId: string){
		const tournament = this.activeTournament.get(tournamentId)
		if (!tournament)
			return
		if (tournament.bracket.length > 0){
			tournament.bracket.forEach(match => {
				match.player1.ready = false
				match.player2.ready = false
				const game: Game = {
					id: match.id,
					status: 'connected',
					player1: match.player1,
					player2: match.player2,
					ball: generateBallPos()
				}
				match.status = 'playing'
				this.gameIdToTournamentId.set(game.id, tournament.id)
				this.initializeGameState(game)
				console.log(`Tournament Match start ${game.player1.id} VS ${game.player2.id}`)
			})
		}
	}

	public tournamentAllPlayersReady(gameId: string, playerId: string): boolean{
		console.log(`Client sent id: ${gameId}`)
		let tournamentId = undefined

		for (let tounaments of this.activeTournament.values() ){
			for (let bracket of tounaments.bracket){
				if (bracket.id === gameId){
					tournamentId = tounaments.id
					break
				}
			}
		}

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

}
