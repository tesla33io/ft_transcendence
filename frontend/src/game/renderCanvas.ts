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

    public render(gameState: GameState): void {
        this.clear();
        this.drawPaddles(gameState);
        this.drawBall(gameState.ball);
        //this.drawScores(gameState);
    }

    private clear(): void {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawPaddles(gameState: GameState): void {
        this.ctx.fillStyle = 'white';
        // Player paddle
        // Player paddle - centered around paddleY
    	this.ctx.fillRect(
        gameState.player.X,
        gameState.player.Y - (GAME_CONFIG.PADDLE.HEIGHT / 2), // Subtract half height to center
        GAME_CONFIG.PADDLE.WIDTH,
        GAME_CONFIG.PADDLE.HEIGHT
    	);

    // Opponent paddle - centered around paddleY
    	this.ctx.fillRect(
        gameState.opponet.X,
        gameState.opponet.Y - (GAME_CONFIG.PADDLE.HEIGHT / 2), // Subtract half height to center
        GAME_CONFIG.PADDLE.WIDTH,
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

    private drawScores(gameState: GameState): void {
        this.ctx.font =  GAME_CONFIG.SCORE.FONT;
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(
            gameState.player.score.toString(),
            GAME_CONFIG.SCORE.RIGHT_X,
            GAME_CONFIG.SCORE.OFFSET_Y
        );
        this.ctx.fillText(
            gameState.opponet.score.toString(),
            GAME_CONFIG.SCORE.LEFT_X,
            GAME_CONFIG.SCORE.OFFSET_Y
        );
    }
}
