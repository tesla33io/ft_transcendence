import { GameEngine } from "./GameEngine";
import { Game, GAME_HEIGHT, GAME_WIDTH } from "../types/types";

export class ClassicPong extends GameEngine {
	protected GAME_SCRORE = 3
	protected PADDLE_HEIGHT = 50

	public initializeGameState(game: Game){
		game.player1.Y = GAME_HEIGHT / 2 - 50
		game.player1.X = 20
		game.player1.score = 0

		game.player2.Y = GAME_HEIGHT / 2 - 50
		game.player2.X = GAME_WIDTH - 40
		game.player2.score = 0

		this.ballReset(game)

		game.status = 'ready'
		this.activeGames.set(game.id, game) // save to the active games
		console.log(`Game ${game.id} initialized:`)
		console.log("Saved to active games")
		console.log(`- Player 1 (${game.player1.name}): paddle at (${game.player1.X}, ${game.player1.Y})`)
		console.log(`- Player 2 (${game.player2.name}): paddle at (${game.player2.X}, ${game.player2.Y})`)
		console.log(`- Ball: position (${game.ball.x}, ${game.ball.y}), velocity (${game.ball.vx}, ${game.ball.vy})`)
	}

	private ballReset(game: Game){
		game.ball.x =  GAME_WIDTH / 2,
		game.ball.y = GAME_WIDTH / 2,
		game.ball.vx = Math.random() > 0.5 ? 5 : -5,
		game.ball.vy = (Math.random() * 4) ? 2 : -2
	}

	protected updateGame(game: Game){
		this.updateBallPosition(game)
		this.updatePlayerScore(game)
		if (this.onGameStatusUpdate)
			this.onGameStatusUpdate(game)
	}

	private updatePlayerScore(game: Game){
		if (game.ball.x <= 0){
			game.player2.score++
			this.ballReset(game)
			console.log(`Player 2 (${game.player2.name}) score!`)
		}
		else if (game.ball.x >= GAME_WIDTH){
			game.player1.score++
			this.ballReset(game)
			console.log(`Player 1 (${game.player1.name}) score!`)
		}

		if (game.player1.score >= this.GAME_SCRORE ||
			game.player2.score >= this.GAME_SCRORE){
			this.stopGame(game)
		}
	}

	public updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void {
		const game = this.activeGames.get(gameId)
		if (!game) return

		if (game.player1.id === playerId) {
			if( game.player1.Y + paddleY + this.PADDLE_HEIGHT <= GAME_HEIGHT &&
				game.player1.Y + paddleY - this.PADDLE_HEIGHT >= 0)
					game.player1.Y += paddleY
		} else if (game.player2.id === playerId) {
			if (game.player2.Y + paddleY + this.PADDLE_HEIGHT <= GAME_HEIGHT &&
				game.player2.Y + paddleY - this.PADDLE_HEIGHT >= 0)
					game.player2.Y += paddleY
		}
	}

	public allPlayerReady(gameId: string, playerId: string): boolean {
		const game = this.activeGames.get(gameId)

		if (game && game.player1.id === playerId)
			game.player1.ready = true
		else if (game && game.player2.id === playerId)
			game.player2.ready = true

		return (game?.player1.ready && game?.player2.ready ? true : false)
	}
}
