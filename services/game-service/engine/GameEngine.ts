import {Game, GAME_HEIGHT, GAME_WIDTH} from "../types/types"

export class GameEngine {
	private activeGames: Map<string, Game> = new Map()
	private gameLoops: Map<string, NodeJS.Timeout> = new Map()
	private FPS = 60
	private FRAME_TIME = 1000 / this.FPS

	constructor(){
		console.log('GameEngine initialized')
	}

	public onGameStatusUpdate?: (game: Game) => void

	public startGame(game: Game){
		console.log(`Starting game ${game.id} with players: ${game.player1.name} vs ${game.player2.name}`)
		this.activeGames.set(game.id, game)

		this.initializeGameState(game)
		const gameLoop = setInterval(() => {
			this.updateGame(game)
		}, this.FRAME_TIME)

		this.gameLoops.set(game.id, gameLoop)
		console.log(`Game loop started for ${game.id} at ${this.FPS} FPS`)
	}

	public stopGame(game: Game){
		const gameLoop = this.gameLoops.get(game.id)
		if (gameLoop){
			clearInterval(gameLoop)
			this.gameLoops.delete(game.id)
		}
		this.activeGames.delete(game.id)
		console.log(`Game ${game.id} stopped`)
	}

	private initializeGameState(game: Game){
		game.player1.paddleY = GAME_HEIGHT / 2 - 50
		game.player1.paddlyX = 20
		game.player1.score = 0

		game.player2.paddleY = GAME_HEIGHT / 2 - 50
		game.player2.paddlyX = GAME_WIDTH - 40
		game.player2.score = 0

		this.ballReset(game)

		game.status = 'playing'
		console.log(`Game ${game.id} initialized:`)
		console.log(`- Player 1 (${game.player1.name}): paddle at (${game.player1.paddlyX}, ${game.player1.paddleY})`)
		console.log(`- Player 2 (${game.player2.name}): paddle at (${game.player2.paddlyX}, ${game.player2.paddleY})`)
		console.log(`- Ball: position (${game.ball.x}, ${game.ball.y}), velocity (${game.ball.vx}, ${game.ball.vy})`)
	}

	private ballReset(game: Game){
		game.ball.x =  GAME_WIDTH / 2,
		game.ball.y = GAME_WIDTH / 2,
		game.ball.vx = Math.random() > 0.5 ? 5 : -5,
		game.ball.vy = (Math.random() * 4) ? 2 : -2
	}

	private updateGame(game: Game){
		this.updateBallPosition(game)
		if (this.onGameStatusUpdate)
			this.onGameStatusUpdate(game)
	}

	private updateBallPosition(game: Game){
		game.ball.x += game.ball.vx
		game.ball.y += game.ball.vy

		if (game.ball.y <= 10){
			game.ball.y = 10
			game.ball.vy *= -1
		}
		else if(game.ball.y >= GAME_HEIGHT - 10){
			game.ball.y = GAME_HEIGHT - 10
			game.ball.vy *= -1
		}

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

		if (game.player1.score >= 3 || game.player2.score >= 3){
			this.stopGame(game)
			console.log('GAME STOP!!!')
		}
	}

	public updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void {
		const game = this.activeGames.get(gameId)
		if (!game) return

		const paddleHeight = 100
		const clampedY = Math.max(0, Math.min(GAME_HEIGHT - paddleHeight, paddleY))

		if (game.player1.id === playerId) {
			game.player1.paddleY = clampedY
		} else if (game.player2.id === playerId) {
			game.player2.paddleY = clampedY
		}
	}
}
