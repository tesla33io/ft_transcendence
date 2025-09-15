import {Game, GAME_HEIGHT, FPS} from "../types/types"

export abstract class GameEngine {
	protected activeGames: Map<string, Game> = new Map()
	protected gameLoops: Map<string, NodeJS.Timeout> = new Map()
	protected FRAME_TIME = 1000 / FPS
	protected GAME_SCRORE = 3

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
			console.log(`Game loop started for ${gameId} at ${FPS} FPS gameLoopID ${gameLoop}`)
		}
		else
			console.log(`Game with Id: ${gameId} doesn't exist`)

	}

	public stopGame(game: Game){
		const gameLoop = this.gameLoops.get(game.id)
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
		this.collisionCheck(game)
	}

	public abstract initializeGameState(game: Game): void
	protected abstract updateGame(game: Game): void
	public abstract updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void
	public abstract allPlayerReady(gameId: string, playerId: string): boolean
	protected abstract collisionCheck(game: Game): void
}



