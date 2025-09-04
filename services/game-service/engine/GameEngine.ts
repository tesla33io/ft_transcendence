import {Game, GAME_HEIGHT, GAME_WIDTH} from "../types/types"

export abstract class GameEngine {
	protected activeGames: Map<string, Game> = new Map()
	protected gameLoops: Map<string, NodeJS.Timeout> = new Map()
	protected FPS = 30
	protected FRAME_TIME = 1000 / this.FPS
	protected GAME_SCRORE = 3
	protected PADDLE_HEIGHT = 50

	constructor(){
		console.log('GameEngine initialized')
	}

	public onGameStatusUpdate?: (game: Game) => void
	public declareWinner?: (game:Game, playerId: string) => void

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

	protected updateBallPosition(game: Game){
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
	}

	public abstract initializeGameState(game: Game): void
	protected abstract updateGame(game: Game): void
	public abstract updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void
	public abstract allPlayerReady(gameId: string, playerId: string): boolean
}


