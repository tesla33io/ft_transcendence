import { type GameState, type Ball, GAME_CONFIG } from '../types';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
	private isInitialized: boolean = false;

	constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
		//set based on conf
		this.canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
		this.canvas.width = GAME_CONFIG.CANVAS.WIDTH;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;
  }

	public initializeCanvas() {
        // Initialize canvas with game dimensions
        this.canvas.height = GAME_CONFIG.CANVAS.HEIGHT;
        this.canvas.width = GAME_CONFIG.CANVAS.WIDTH;
        this.isInitialized = true;
    }

    public isReady(): boolean {
        return this.isInitialized;
    }

    // Track where ball was last and when it updated
    private lastBallPosition?: { x: number; y: number };
    private ballUpdateTime: number = 0;
    private ballInterpolationAlpha: number = 0;



    public render(gameState: GameState): void {
		this.clear();
        this.drawPaddles(gameState);

        // STEP 1: Calculate interpolated position
        const interpolatedBall = this.getInterpolatedBall(gameState.ball);
        this.drawBall(interpolatedBall);

        // STEP 2: Did the ball position change? If yes, reset interpolation
        if (!this.lastBallPosition ||
            gameState.ball.x !== this.lastBallPosition.x ||
            gameState.ball.y !== this.lastBallPosition.y) {
            // New server update received - store it and reset timer
            this.lastBallPosition = { x: gameState.ball.x, y: gameState.ball.y };
            this.ballUpdateTime = performance.now();  // ← Mark when update happened
            this.ballInterpolationAlpha = 0;  // ← Start fresh interpolation
        }
    }

    private getInterpolatedBall(currentBall: Ball): Ball {
        if (!this.lastBallPosition) {
            // First frame - no previous position to interpolate from
            return currentBall;
        }

        // STEP 3: Calculate how far through the current frame we are (0 to 1)
        const timeSinceUpdate = performance.now() - this.ballUpdateTime;
        const frameTime = 1000 / 60; // ~16.67ms per frame at 60 FPS

        this.ballInterpolationAlpha = Math.min(
            timeSinceUpdate / frameTime,
            1  // Cap at 1.0 (don't go beyond current position)
        );

        // STEP 4: Apply interpolation formula
        // Mix last position with current position based on alpha
        return {
            x: this.lastBallPosition.x +
               (currentBall.x - this.lastBallPosition.x) * this.ballInterpolationAlpha,
            y: this.lastBallPosition.y +
               (currentBall.y - this.lastBallPosition.y) * this.ballInterpolationAlpha,
            vx: currentBall.vx,
            vy: currentBall.vy
        };
    }

    public clear(): void {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawPaddles(gameState: GameState): void {
        this.ctx.fillStyle = 'white';
    	this.ctx.fillRect(
        gameState.player.X,
        gameState.player.Y - (GAME_CONFIG.PADDLE.HEIGHT / 2), // Subtract half height to center
        GAME_CONFIG.PADDLE.WIDTH,
        GAME_CONFIG.PADDLE.HEIGHT
    	);

    // Opponent paddle - centered around paddleY
    	this.ctx.fillRect(
        gameState.opponent.X,
        gameState.opponent.Y - (GAME_CONFIG.PADDLE.HEIGHT / 2), // Subtract half height to center
        - GAME_CONFIG.PADDLE.WIDTH,
          GAME_CONFIG.PADDLE.HEIGHT
    	);
	}
    private drawBall(ball: Ball): void {
        this.ctx.beginPath();
        this.ctx.arc(
			ball.x,
			ball.y,
			GAME_CONFIG.BALL.RADIUS,
			0,
			Math.PI * 2
		);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
    }


}
