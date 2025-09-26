import { Renderer } from './renderCanvas';
import { GAME_CONFIG, type GameState, type Paddle, type Ball } from '../types';
import { GAME_MODES } from '../constants';

interface Pellet {
    x: number;
    y: number;
    dx: number;
    owner: 'player' | 'opponent';
}

export class LocalPongGame {
    private renderer: Renderer;
    private gameState: GameState & { pellets: Pellet[] }; // Extend GameState for pellets
    private keysPressed: { [key: string]: boolean } = {};
    private animationFrameId: number = 0;
    private isPlayerMagnetActive: boolean = false;
    private isOpponentMagnetActive: boolean = false;
    private playerPelletsRemaining: number;
    private opponentPelletsRemaining: number;
    private playerMagnetUsesRemaining: number;
    private opponentMagnetUsesRemaining: number;

    constructor(private canvas: HTMLCanvasElement, private winningScore: number, private mode: string = GAME_MODES.CLASSIC) {
        this.renderer = new Renderer(canvas);
        this.playerPelletsRemaining = this.winningScore;
        this.opponentPelletsRemaining = this.winningScore;
        this.playerMagnetUsesRemaining = this.winningScore * 2;
        this.opponentMagnetUsesRemaining = this.winningScore * 2;
        this.gameState = this.createInitialState();
    }

    private createInitialState(): GameState & { pellets: Pellet[] } {
        return {
            status: 'playing',
            gameid: 'local',
            player: {
                name: 'Player 1',
                score: 0,
                X: GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            },
            opponet: {
                name: 'Player 2',
                score: 0,
                X: GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE - GAME_CONFIG.PADDLE.WIDTH,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            },
            ball: this.resetBall(),
            pellets: [],
        };
    }

    private resetBall(): Ball {
        const speedMultiplier = this.mode === GAME_MODES.SPEED ? 1.2 : 1.0;
        const initialSpeedX = GAME_CONFIG.BALL.INITIAL_SPEED.X * speedMultiplier;

        return {
            x: GAME_CONFIG.CANVAS.WIDTH / 2,
            y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            dx: Math.random() > 0.5 ? initialSpeedX : -initialSpeedX,
            dy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,
        };
    }

    public start(): void {
        this.initializeEventListeners();
        this.renderer.initializeCanvas();
        this.updateResourceDisplay(); // Ensure initial resource counts are shown
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

        if (this.mode === GAME_MODES.PELLET) {
            if (event.key.toLowerCase() === 'd') this.shootPellet('player');
            if (event.key.toLowerCase() === 'arrowleft') this.shootPellet('opponent');
            
            // Activate magnet only if not already active and uses are remaining
            if (event.key.toLowerCase() === 'a' && !this.isPlayerMagnetActive && this.playerMagnetUsesRemaining > 0) {
                this.isPlayerMagnetActive = true;
                this.playerMagnetUsesRemaining--;
                this.updateResourceDisplay();
            }
            if (event.key.toLowerCase() === 'arrowright' && !this.isOpponentMagnetActive && this.opponentMagnetUsesRemaining > 0) {
                this.isOpponentMagnetActive = true;
                this.opponentMagnetUsesRemaining--;
                this.updateResourceDisplay();
            }
        }
    };
    private handleKeyUp = (event: KeyboardEvent): void => {
        this.keysPressed[event.key.toLowerCase()] = false;
        if (this.mode === GAME_MODES.PELLET) {
            if (event.key.toLowerCase() === 'a') this.isPlayerMagnetActive = false;
            if (event.key.toLowerCase() === 'arrowright') this.isOpponentMagnetActive = false;
        }
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
            this.gameState.opponet.Y -= paddleSpeed;
        }
        if (this.keysPressed['arrowdown']) {
            this.gameState.opponet.Y += paddleSpeed;
        }

        // Clamp paddle positions to stay within the canvas
        this.gameState.player.Y = Math.max(paddleHeight / 2, Math.min(canvasHeight - paddleHeight / 2, this.gameState.player.Y));
        this.gameState.opponet.Y = Math.max(paddleHeight / 2, Math.min(canvasHeight - paddleHeight / 2, this.gameState.opponet.Y));
    }

    private shootPellet(shooter: 'player' | 'opponent'): void {
        // Allow only one pellet per player at a time
        if (this.mode !== GAME_MODES.PELLET || this.gameState.pellets.some(p => p.owner === shooter)) {
            return;
        }

        let paddle, dx, pelletsRemaining;
        if (shooter === 'player') {
            if (this.playerPelletsRemaining <= 0) return;
            this.playerPelletsRemaining--;
            paddle = this.gameState.player;
            dx = 20;
        } else {
            if (this.opponentPelletsRemaining <= 0) return;
            this.opponentPelletsRemaining--;
            paddle = this.gameState.opponet;
            dx = -20;
        }
        this.updateResourceDisplay();

        this.gameState.pellets.push({
            x: paddle.X + (shooter === 'player' ? GAME_CONFIG.PADDLE.WIDTH : 0),
            y: paddle.Y,
            dx: dx,
            owner: shooter,
        });
    }

    private updatePellets(): void {
        if (this.mode !== GAME_MODES.PELLET) return;

        const { pellets, player, opponet } = this.gameState;

        for (let i = pellets.length - 1; i >= 0; i--) {
            const pellet = pellets[i];
            pellet.x += pellet.dx;

            // Check for collision with opponent paddle
            const targetPaddle = pellet.owner === 'player' ? opponet : player;
            const paddleTop = targetPaddle.Y - GAME_CONFIG.PADDLE.HEIGHT / 2;
            const paddleBottom = targetPaddle.Y + GAME_CONFIG.PADDLE.HEIGHT / 2;

            if (
                pellet.x >= targetPaddle.X &&
                pellet.x <= targetPaddle.X + GAME_CONFIG.PADDLE.WIDTH &&
                pellet.y >= paddleTop &&
                pellet.y <= paddleBottom
            ) {
                // Point scored
                if (pellet.owner === 'player') {
                    this.gameState.player.score++;
                } else {
                    this.gameState.opponet.score++;
                }
                this.updateScoreboard();
                pellets.splice(i, 1); // Remove pellet

                // Check for win condition after scoring
                if (this.gameState.player.score >= this.winningScore) this.endGame(this.gameState.player.name);
                if (this.gameState.opponet.score >= this.winningScore) this.endGame(this.gameState.opponet.name);
                continue;
            }

            // Remove pellet if it goes off-screen
            if (pellet.x < 0 || pellet.x > GAME_CONFIG.CANVAS.WIDTH) {
                pellets.splice(i, 1);
            }
        }
    }

    private applyMagnetForce(): void {
        if (this.mode !== GAME_MODES.PELLET) return;

        const { ball, player, opponet } = this.gameState;
        const magnetStrength = 0.4; // A tunable value for the force

        let targetPaddle: Paddle | null = null;
        // Magnet is active if the flag is set (which happens on keydown, consuming one use)
        if (this.isPlayerMagnetActive) {
            targetPaddle = player;
        } else if (this.isOpponentMagnetActive) {
            targetPaddle = opponet;
        }
        // No decrement here; uses are consumed on keydown.
        
        if (targetPaddle) {
            // Calculate vector from ball to the center of the paddle
            const vectorX = targetPaddle.X - ball.x;
            const vectorY = targetPaddle.Y - ball.y;

            // Normalize the vector
            const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
            if (distance > 1) { // Avoid division by zero or extreme forces when close
                const normalizedX = vectorX / distance;
                const normalizedY = vectorY / distance;

                // Apply the force to the ball's velocity
                ball.dx += normalizedX * magnetStrength;
                ball.dy += normalizedY * magnetStrength;
            }
        }
    }

    private updateBall(): void {
        const { ball, player, opponet } = this.gameState;
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision (top/bottom)
        if (ball.y + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.HEIGHT || ball.y - GAME_CONFIG.BALL.RADIUS < 0) {
            ball.dy *= -1;
        }

        // Apply magnet force if active
        this.applyMagnetForce();

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
        if ((ball.dx < 0 && collidesWithPaddle(player)) || (ball.dx > 0 && collidesWithPaddle(opponet))) {
            const accelerationFactor = this.mode === GAME_MODES.SPEED ? 1.10 : 1.05;
            ball.dx *= -1;
            // Optional: Increase speed slightly on each hit
            ball.dx *= accelerationFactor;
        }

        // Score update when ball goes past a paddle
        if (ball.x - GAME_CONFIG.BALL.RADIUS < 0) {
            this.gameState.opponet.score++;
            this.updateScoreboard();
            if (this.gameState.opponet.score >= this.winningScore) {
                this.endGame(this.gameState.opponet.name);
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
        if (p2Score) p2Score.textContent = this.gameState.opponet.score.toString();
    }

    private updateResourceDisplay(): void {
        if (this.mode !== GAME_MODES.PELLET) return;

        const p1Resources = document.getElementById('player1-resources');
        const p2Resources = document.getElementById('player2-resources');

        if (p1Resources) {
            p1Resources.textContent = `Pellets: ${this.playerPelletsRemaining} | Magnets: ${this.playerMagnetUsesRemaining}`;
        }
        if (p2Resources) {
            p2Resources.textContent = `Pellets: ${this.opponentPelletsRemaining} | Magnets: ${this.opponentMagnetUsesRemaining}`;
        }
    }

    private gameLoop = (): void => {
        if (this.gameState.status !== 'playing') {
            return;
        }
        this.updatePellets();
        this.updatePaddles();
        this.updateBall();
        this.renderer.render(this.gameState);
        this.drawPellets(); // Drawing pellets after the main render
        // Initial display is now handled in start()
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    private drawPellets(): void {
        const context = this.canvas.getContext('2d');
        if (!context || this.mode !== GAME_MODES.PELLET) return;

        context.fillStyle = 'yellow';
        this.gameState.pellets.forEach(pellet => {
            context.beginPath();
            context.arc(pellet.x, pellet.y, 5, 0, Math.PI * 2); // 5px radius pellet
            context.fill();
        });
    }

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