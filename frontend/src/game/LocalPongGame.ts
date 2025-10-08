import { Renderer } from './renderCanvas';
import { GAME_CONFIG, type GameState, type Paddle, type Ball } from '../types';

export class LocalPongGame {
    private renderer: Renderer;
    private gameState: GameState;
    private keysPressed: { [key: string]: boolean } = {};
    private animationFrameId: number = 0;

    constructor(private canvas: HTMLCanvasElement, private winningScore: number) {
        this.renderer = new Renderer(canvas);
        this.gameState = this.createInitialState();
    }

    private createInitialState(): GameState {
        return {
            status: 'playing',
            gameid: 'local',
            player: {
                name: 'Player 1',
                score: 0,
                X: GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            },
            opponent: {
                name: 'Player 2',
                score: 0,
                X: GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE - GAME_CONFIG.PADDLE.WIDTH,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            },
            ball: this.resetBall(),
        };
    }

    private resetBall(): Ball {
        return {
            x: GAME_CONFIG.CANVAS.WIDTH / 2,
            y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            dx: Math.random() > 0.5 ? GAME_CONFIG.BALL.INITIAL_SPEED.X : -GAME_CONFIG.BALL.INITIAL_SPEED.X,
            dy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,
        };
    }

    public start(): void {
        this.initializeEventListeners();
        this.renderer.initializeCanvas();
        this.gameLoop();
    }

    private initializeEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    private removeEventListeners(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        this.keysPressed[event.key.toLowerCase()] = true;
    };

    private handleKeyUp = (event: KeyboardEvent): void => {
        this.keysPressed[event.key.toLowerCase()] = false;
    };

    private updatePaddles(): void {
        const paddleSpeed = 5; // Reverted to a local constant to fix movement
        const canvasHeight = GAME_CONFIG.CANVAS.HEIGHT;
        const paddleHeight = GAME_CONFIG.PADDLE.HEIGHT;

        // Player 1 (W/S)
        if (this.keysPressed['w']) {
            this.gameState.player.Y -= paddleSpeed;
        }
        if (this.keysPressed['s']) {
            this.gameState.player.Y += paddleSpeed;
        }

        // Player 2 (ArrowUp/ArrowDown)
        if (this.keysPressed['arrowup']) {
            this.gameState.opponent.Y -= paddleSpeed;
        }
        if (this.keysPressed['arrowdown']) {
            this.gameState.opponent.Y += paddleSpeed;
        }

        // Clamp paddle positions to stay within the canvas
        this.gameState.player.Y = Math.max(paddleHeight / 2, Math.min(canvasHeight - paddleHeight / 2, this.gameState.player.Y));
        this.gameState.opponent.Y = Math.max(paddleHeight / 2, Math.min(canvasHeight - paddleHeight / 2, this.gameState.opponent.Y));
    }

    private updateBall(): void {
        const { ball, player, opponent } = this.gameState;
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision (top/bottom)
        if (ball.y + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.HEIGHT || ball.y - GAME_CONFIG.BALL.RADIUS < 0) {
            ball.dy *= -1;
        }

        // Paddle collision logic
        const collidesWithPaddle = (paddle: Paddle) => {
            const paddleTop = paddle.Y - GAME_CONFIG.PADDLE.HEIGHT / 2;
            const paddleBottom = paddle.Y + GAME_CONFIG.PADDLE.HEIGHT / 2;
            const paddleLeft = paddle.X;
            const paddleRight = paddle.X + GAME_CONFIG.PADDLE.WIDTH;

            return (
                ball.x + GAME_CONFIG.BALL.RADIUS > paddleLeft &&
                ball.x - GAME_CONFIG.BALL.RADIUS < paddleRight &&
                ball.y + GAME_CONFIG.BALL.RADIUS > paddleTop &&
                ball.y - GAME_CONFIG.BALL.RADIUS < paddleBottom
            );
        };

        // Check for collision and reverse ball direction
        if ((ball.dx < 0 && collidesWithPaddle(player)) || (ball.dx > 0 && collidesWithPaddle(opponent))) {
            ball.dx *= -1;
            // Optional: Increase speed slightly on each hit
            ball.dx *= 1.05;
        }

        // Score update when ball goes past a paddle
        if (ball.x - GAME_CONFIG.BALL.RADIUS < 0) {
            this.gameState.opponent.score++;
            this.updateScoreboard();
            if (this.gameState.opponent.score >= this.winningScore) {
                this.endGame(this.gameState.opponent.name);
            } else {
                this.gameState.ball = this.resetBall();
            }
        } else if (ball.x + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.WIDTH) {
            this.gameState.player.score++;
            this.updateScoreboard();
            if (this.gameState.player.score >= this.winningScore) {
                this.endGame(this.gameState.player.name);
            } else {
                this.gameState.ball = this.resetBall();
            }
        }
    }

    private updateScoreboard(): void {
        const p1Score = document.getElementById('player1-score');
        const p2Score = document.getElementById('player2-score');
        if (p1Score) p1Score.textContent = this.gameState.player.score.toString();
        if (p2Score) p2Score.textContent = this.gameState.opponent.score.toString();
    }

    private gameLoop = (): void => {
        if (this.gameState.status !== 'playing') {
            return;
        }
        this.updatePaddles();
        this.updateBall();
        this.renderer.render(this.gameState);
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    private endGame(winner: string): void {
        this.gameState.status = 'finished';
        cancelAnimationFrame(this.animationFrameId);
        this.removeEventListeners();
        this.displayGameOver(winner);
    }

    private displayGameOver(winner: string): void {
        const context = this.canvas.getContext('2d');
        if (!context) return;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderer.drawText(`Game Over`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.renderer.drawText(`${winner} wins!`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    public dispose(): void {
        cancelAnimationFrame(this.animationFrameId);
        this.removeEventListeners();
        console.log("Local game disposed.");
    }
}