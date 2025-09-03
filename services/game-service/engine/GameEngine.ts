import {Game, GAME_HEIGHT, GAME_WIDTH} from "../types/types"

export abstract class GameEngine {
	protected activeGames: Map<string, Game> = new Map()
	protected gameLoops: Map<string, NodeJS.Timeout> = new Map()
	protected FPS = 30
	protected FRAME_TIME = 1000 / this.FPS

	constructor(){
		console.log('GameEngine initialized')
	}

	public onGameStatusUpdate?: (game: Game) => void

	public startGame(gameId: string){
		const game = this.activeGames.get(gameId)
		if (game){
			const gameLoop = setInterval(() => {
				this.updateGame(game)
			}, this.FRAME_TIME)
			this.gameLoops.set(gameId, gameLoop)
			console.log(`Game loop started for ${gameId} at ${this.FPS} FPS gameLoopID ${gameLoop}`)
		}
		else
			console.log(`Game with Id: ${gameId} doesn't exist`)

	}

	public stopGame(game: Game){
		const gameLoop = this.gameLoops.get(game.id)
		console.log("gameloop of the game: ", gameLoop)
		if (gameLoop){
			clearInterval(gameLoop)
			this.gameLoops.delete(game.id)
		}
		this.activeGames.delete(game.id)
		console.log(`Game [${game.id}] stopped`)
	}

	// public initializeGameState(game: Game){
	// 	game.player1.paddleY = GAME_HEIGHT / 2 - 50
	// 	game.player1.paddlyX = 20
	// 	game.player1.score = 0

	// 	game.player2.paddleY = GAME_HEIGHT / 2 - 50
	// 	game.player2.paddlyX = GAME_WIDTH - 40
	// 	game.player2.score = 0

	// 	this.ballReset(game)

	// 	game.status = 'ready'
	// 	this.activeGames.set(game.id, game) // save to the active games
	// 	console.log(`Game ${game.id} initialized:`)
	// 	console.log("Saved to active games")
	// 	console.log(`- Player 1 (${game.player1.name}): paddle at (${game.player1.paddlyX}, ${game.player1.paddleY})`)
	// 	console.log(`- Player 2 (${game.player2.name}): paddle at (${game.player2.paddlyX}, ${game.player2.paddleY})`)
	// 	console.log(`- Ball: position (${game.ball.x}, ${game.ball.y}), velocity (${game.ball.vx}, ${game.ball.vy})`)
	// }

	// private ballReset(game: Game){
	// 	game.ball.x =  GAME_WIDTH / 2,
	// 	game.ball.y = GAME_WIDTH / 2,
	// 	game.ball.vx = Math.random() > 0.5 ? 5 : -5,
	// 	game.ball.vy = (Math.random() * 4) ? 2 : -2
	// }

	// private updateGame(game: Game){
	// 	this.updateBallPosition(game)
	// 	if (this.onGameStatusUpdate)
	// 		this.onGameStatusUpdate(game)
	// }

	// private updateBallPosition(game: Game){
	// 	game.ball.x += game.ball.vx
	// 	game.ball.y += game.ball.vy

	// 	if (game.ball.y <= 10){
	// 		game.ball.y = 10
	// 		game.ball.vy *= -1
	// 	}
	// 	else if(game.ball.y >= GAME_HEIGHT - 10){
	// 		game.ball.y = GAME_HEIGHT - 10
	// 		game.ball.vy *= -1
	// 	}

	// 	if (game.ball.x <= 0){
	// 		game.player2.score++
	// 		this.ballReset(game)
	// 		console.log(`Player 2 (${game.player2.name}) score!`)
	// 	}
	// 	else if (game.ball.x >= GAME_WIDTH){
	// 		game.player1.score++
	// 		this.ballReset(game)
	// 		console.log(`Player 1 (${game.player1.name}) score!`)
	// 	}

	// 	if (game.player1.score >= 3 || game.player2.score >= 3){
	// 		this.stopGame(game)
	// 		console.log('GAME STOP!!!')
	// 	}
	// }

	// public updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void {
	// 	const game = this.activeGames.get(gameId)
	// 	if (!game) return

	// 	const paddleHeight = 50
	// 	if (game.player1.id === playerId) {
	// 		if( game.player1.paddleY + paddleY + paddleHeight <= GAME_HEIGHT &&
	// 			game.player1.paddleY + paddleY - paddleHeight >= 0)
	// 				game.player1.paddleY += paddleY
	// 	} else if (game.player2.id === playerId) {
	// 		if (game.player2.paddleY + paddleY + paddleHeight <= GAME_HEIGHT &&
	// 			game.player2.paddleY + paddleY - paddleHeight >= 0)
	// 				game.player2.paddleY += paddleY
	// 	}
	// }


	public allPlayerReady(gameId: string, playerId: string): boolean {
		const game = this.activeGames.get(gameId)

		if (game && game.player1.id === playerId)
			game.player1.ready = true
		else if (game && game.player2.id === playerId)
			game.player2.ready = true

		if (game && game.player1.ready && game.player2.ready)
			return true
		else
			return false
	}

	public abstract initializeGameState(game: Game): void
	protected abstract updateGame(game: Game): void
	public abstract updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void
}


