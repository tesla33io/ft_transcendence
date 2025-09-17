import { ClassicPong } from "../engine/ClassicPong"
import { Player, generateGameId, Tournament, TournamentMatch, Game, generateBallPos } from "../types/types"

/**
 Maybe TournamentPong will be the extention of the Classicpong
 make the logic to par the winners until there will be
 only one player left
 */

export class TournamentPong extends ClassicPong{

	private activeTournament: Map<string, Tournament> = new Map()

	public createTournament(players: Player[]){
		const tournamentId = generateGameId()

		const tournament: Tournament = {
			id: generateGameId(),
			status: 'waiting',
			players,
			bracket: this.generateBracket(tournamentId, players),
			winner: null
		}
		this.activeTournament.set(tournamentId, tournament)

		return tournamentId
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
	private startRoundMatches(tournamentId: string){
		const tournament = this.activeTournament.get(tournamentId)
		if (!tournament)
			return
		tournament.bracket.forEach(match => {
			const game: Game = {
				id: generateGameId(),
				status: 'connected',
				player1: match.player1,
				player2: match.player2,
				ball: generateBallPos()
			}

			match.id = game.id
			match.status = 'playing'

			//maybe store the gameId with tournamentId

			this.initializeGameState(game)
			console.log(`Tournament Match start ${game.player1.id} VS ${game.player2.id}`)
		})
	}

	public allTournamentPlayerReady(tournamentId: string, playerId: string){

	}
}
