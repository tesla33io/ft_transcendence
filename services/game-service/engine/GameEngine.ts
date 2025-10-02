import {Game, GAME_HEIGHT, FPS} from "../types/types"

export abstract class GameEngine {
	protected activeGames: Map<string, Game> = new Map()
	protected gameLoops: Map<string, NodeJS.Timeout> = new Map()
	protected FRAME_TIME = 1000 / FPS
	protected GAME_SCORE = 10

	constructor(){
		console.log('GameEngine initialized')
	}

	public onGameStatusUpdate?: (game: Game) => void
	public declareWinner?: (game:Game, playerId: string) => void
	public disconnectClient?: (playerId: string) => void

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

	public stopGame(gameId: string){
		const gameLoop = this.gameLoops.get(gameId)
		if (gameLoop){
			clearInterval(gameLoop)
			this.gameLoops.delete(gameId)
		}
		this.activeGames.delete(gameId)
		console.log(`Game [${gameId}] stopped`)
	}

	protected updateBallPosition(game: Game){
		game.ball.x += game.ball.vx
		game.ball.y += game.ball.vy

		if (game.ball.y <= 0){
			game.ball.y = 10
			game.ball.vy *= -1
			game.ball.vx = game.ball.vx < 0 ? --game.ball.vx : ++game.ball.vx
		}
		else if(game.ball.y >= GAME_HEIGHT){
			game.ball.y = GAME_HEIGHT - 10
			game.ball.vy *= -1
			game.ball.vx = game.ball.vx < 0 ? --game.ball.vx : ++game.ball.vx
		}
		this.collisionCheck(game)
	}

	public findPlayerInGame(playerId: string): Game | undefined{
		for (const game of this.activeGames.values()){
			if (game){
				if (game.player1.id === playerId ||
					game.player2.id === playerId)
					return game
			}
		}
		return undefined
	}

	public abstract initializeGameState(game: Game): void
	protected abstract updateGame(game: Game): void
	public abstract updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void
	public abstract allPlayerReady(gameId: string, playerId: string): boolean
	protected abstract collisionCheck(game: Game): void
}



