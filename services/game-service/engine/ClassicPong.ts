import { GameEngine } from "./GameEngine";
import { GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, PLAYER_OFFSET, GAME_SCORE } from "../types/types";
import { Game, Player} from "../types/interfaces"

export class ClassicPong extends GameEngine {
	private readonly BALL_MAX_SPEED = 16
	private readonly K = 2
	private readonly GOAL_EDGE = 10

	public initializeGameState(game: Game){
		game.player1.Y = GAME_HEIGHT / 2
		game.player1.X = PLAYER_OFFSET
		game.player1.score = 0

		game.player2.Y = GAME_HEIGHT / 2
		game.player2.X = GAME_WIDTH - PLAYER_OFFSET
		game.player2.score = 0

		this.ballReset(game)

		game.status = 'ready'
		this.activeGames.set(game.id, game)
		console.log(`Game ${game.id} initialized:`)
		console.log("Saved to active games")
	}

	private ballReset(game: Game){
		game.ball.x =  GAME_WIDTH / 2
		game.ball.y = Math.random() * GAME_HEIGHT
		game.ball.vx = Math.random() > 0.5 ? 2 : -2
		game.ball.vy = (Math.random() > 0.5) ? 2 : -2
	}

	protected updateGame(game: Game){
		this.updateBallPosition(game)
		this.updatePlayerScore(game)
		this.paddleCollisionCheck(game)
		if (this.onGameStatusUpdate)
			this.onGameStatusUpdate(game)
		if (game.player1.score >= GAME_SCORE ||
			game.player2.score >= GAME_SCORE){
			this.stopGame(game.id)
			const winner = game.player1.score > game.player2.score ? game.player1.id : game.player2.id
			if (this.declareWinner)
				this.declareWinner(game, winner)
		}
	}

	private updatePlayerScore(game: Game){
		if (game.ball.x < PLAYER_OFFSET - PADDLE_WIDTH &&
				game.ball.vx < 0){
			game.player2.score++
			this.ballReset(game)
			console.log(`Player 2 (${game.player2.name}) score!`)
		}
		else if (game.ball.x > GAME_WIDTH - PLAYER_OFFSET + PADDLE_WIDTH &&
				game.ball.vx > 0){
			game.player1.score++
			this.ballReset(game)
			console.log(`Player 1 (${game.player1.name}) score!`)
		}
	}

	public updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void {
		const game = this.activeGames.get(gameId)
		if (!game) return

		if (game.player1.id === playerId) {
			if( game.player1.Y + paddleY + PADDLE_HEIGHT / 2 <= GAME_HEIGHT &&
				game.player1.Y + paddleY - PADDLE_HEIGHT / 2 >= 0)
					game.player1.Y += paddleY
		} else if (game.player2.id === playerId) {
			if (game.player2.Y + paddleY + PADDLE_HEIGHT / 2 <= GAME_HEIGHT &&
				game.player2.Y + paddleY - PADDLE_HEIGHT / 2 >= 0)
					game.player2.Y += paddleY
		}
	}

	public allPlayerReady(gameId: string, playerId: string): boolean {
		const game = this.activeGames.get(gameId)
		if (!game)
			return false

		if (game.player1.id === playerId)
			game.player1.ready = true
		else if (game.player2.id === playerId)
			game.player2.ready = true
		return (game.player1.ready && game.player2.ready ? true : false)
	}

	protected paddleCollisionCheck(game: Game): void {
		if (game.ball.x < game.player1.X + PADDLE_WIDTH && game.ball.vx < 0){
			this.paddleCollision(game, game.player1)
		}

		else if (game.ball.x > game.player2.X - PADDLE_WIDTH && game.ball.vx > 0) {
			this.paddleCollision(game, game.player2)
		}
	}

	private paddleCollision(game: Game, player: Player){
		if ((game.ball.y >= player.Y - 2 &&
			game.ball.y <= player.Y + 2 )){
			game.ball.vx = game.ball.vx < 0 ? -2 : 2
			game.ball.vx *= -1
			// console.log(`ball colided with paddle player ${player.name} ball: ${game.ball.x} paddle ${game.player1.X} `)
		}

		else if ((game.ball.y === player.Y - PADDLE_HEIGHT / 2 - this.K ||
			game.ball.y === player.Y + PADDLE_HEIGHT / 2 + this.K)){
			game.ball.vx = game.ball.vx < 0 ? game.ball.vx - this.K : game.ball.vx + this.K
			if (Math.abs(game.ball.vx) > this.BALL_MAX_SPEED)
				game.ball.vx = game.ball.vx < 0 ? -this.BALL_MAX_SPEED : this.BALL_MAX_SPEED
			game.ball.vx *= -1
			game.ball.vy *= -1
			// console.log(`ball colided with paddle player ${player.name} ball: ${game.ball.x} paddle ${game.player1.X} `)
		}

		else if ((game.ball.y >= player.Y - PADDLE_HEIGHT / 2 &&
			game.ball.y <= player.Y + PADDLE_HEIGHT / 2)){
			game.ball.vx = game.ball.vx < 0 ? game.ball.vx - this.K : game.ball.vx + this.K
			if (Math.abs(game.ball.vx) > this.BALL_MAX_SPEED)
				game.ball.vx = game.ball.vx < 0 ? -this.BALL_MAX_SPEED : this.BALL_MAX_SPEED
			game.ball.vx *= -1
			// console.log(`ball colided with paddle player ${player.name} ball: ${game.ball.x} paddle ${game.player1.X} `)
		}
	}
}
