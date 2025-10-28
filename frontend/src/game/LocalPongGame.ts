import { Renderer } from './renderCanvas';
import { GAME_CONFIG, type Ball } from '../types';
import { Router } from '../router';
import { GAME_MODES } from '../constants';

interface Pellet {
    x: number;
    y: number;
    dx: number;
    owner: 'player' | 'opponent';
}

// ✅ FIXED: Proper Player interface for local game (different from multiplayer)
interface Player {
    name: string;
    score: number;
    X: number;
    Y: number;
    paddleHeight: number;
}

// ✅ FIXED: GameState with correct property names (opponent not opponet)
interface LocalGameState {
    status: 'countdown' | 'playing' | 'finished';
    gameid: string;
    player: Player;
    opponent: Player;  // ✅ FIXED: Was "opponet"
    ball: Ball;
    pellets: Pellet[];
    extra_balls: Ball[];
}

export class LocalPongGame {
    private renderer: Renderer;
    private gameState: LocalGameState;
    private keysPressed: { [key: string]: boolean } = {};
    private animationFrameId: number = 0;
    private isPlayerMagnetActive: boolean = false;
    private isOpponentMagnetActive: boolean = false;
    private playerPelletsRemaining: number;
    private opponentPelletsRemaining: number;
    private playerMagnetUsesRemaining: number;
    private opponentMagnetUsesRemaining: number;
    private multiBallInterval: number | null = null;

    private playerSpeedUpUses: number;
    private opponentSpeedUpUses: number;
    private playerGrowPaddleUses: number;
    private opponentGrowPaddleUses: number;
    private isPlayerSpeedUpActive: boolean = false;
    private isOpponentSpeedUpActive: boolean = false;
    private playerOriginalPaddleHeight: number = GAME_CONFIG.PADDLE.HEIGHT;
    private opponentOriginalPaddleHeight: number = GAME_CONFIG.PADDLE.HEIGHT;

    private countdown: number = 3;

    constructor(
        private canvas: HTMLCanvasElement, 
        private winningScore: number, 
        private mode: string,
        private router: Router,
        private gameContainer: HTMLElement
    ) {
        this.renderer = new Renderer(canvas);
        this.playerPelletsRemaining = this.winningScore;
        this.opponentPelletsRemaining = this.winningScore;
        this.playerMagnetUsesRemaining = this.winningScore * 2;
        this.opponentMagnetUsesRemaining = this.winningScore * 2;
        this.playerSpeedUpUses = 3;
        this.opponentSpeedUpUses = 3;
        this.playerGrowPaddleUses = 3;
        this.opponentGrowPaddleUses = 3;
        this.gameState = this.createInitialState();
    }

    private createInitialState(): LocalGameState {
        return {
            status: 'countdown',
            gameid: 'local',
            player: {
                name: 'Player 1',
                score: 0,
                X: GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
                paddleHeight: GAME_CONFIG.PADDLE.HEIGHT,
            },
            opponent: {  // ✅ FIXED: Was "opponet"
                name: 'Player 2',
                score: 0,
                X: GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE - GAME_CONFIG.PADDLE.WIDTH,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
                paddleHeight: GAME_CONFIG.PADDLE.HEIGHT,
            },
            ball: this.resetBall(),
            pellets: [],
            extra_balls: [],
        };
    }

    private resetBall(): Ball {
        let speedMultiplier = 1.0;
        if (this.mode === GAME_MODES.SPEED) {
            speedMultiplier = 1.2;
        } else if (this.mode === GAME_MODES.MULTIBALL) {
            speedMultiplier = 0.4;
        }

        const initialSpeedX = GAME_CONFIG.BALL.INITIAL_SPEED.X * speedMultiplier;

        return {
            x: GAME_CONFIG.CANVAS.WIDTH / 2,
            y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            vx: Math.random() > 0.5 ? initialSpeedX : -initialSpeedX,  // ✅ FIXED: vx not dx
            vy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,  // ✅ FIXED: vy not dy
        };
    }

    public start(): void {
        this.renderer.initializeCanvas();
        this.updateResourceDisplay();
        this.updateMultiBallResourceDisplay();
        this.startCountdown();
    }

    private startCountdown(): void {
        const countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
                clearInterval(countdownInterval);
                this.startGame();
            }
        }, 1000);
        this.gameLoop();
    }

    private startGame(): void {
        this.gameState.status = 'playing';
        this.initializeEventListeners();
        if (this.mode === GAME_MODES.MULTIBALL) {
            this.multiBallInterval = window.setInterval(() => {
                this.spawnExtraBall();
            }, 1000);
        }
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
        } else if (this.mode === GAME_MODES.MULTIBALL) {
            if (event.key.toLowerCase() === 'a' && this.playerSpeedUpUses > 0) {
                this.playerSpeedUpUses--;
                this.isPlayerSpeedUpActive = true;
                setTimeout(() => {
                    this.isPlayerSpeedUpActive = false;
                }, 4000);
                this.updateMultiBallResourceDisplay();
            }
            if (event.key.toLowerCase() === 'd' && this.playerGrowPaddleUses > 0) {
                this.playerGrowPaddleUses--;
                this.gameState.player.paddleHeight = this.playerOriginalPaddleHeight * 2;
                setTimeout(() => {
                    this.gameState.player.paddleHeight = this.playerOriginalPaddleHeight;
                }, 2000);
                this.updateMultiBallResourceDisplay();
            }

            if (event.key.toLowerCase() === 'arrowright' && this.opponentSpeedUpUses > 0) {
                this.opponentSpeedUpUses--;
                this.isOpponentSpeedUpActive = true;
                setTimeout(() => {
                    this.isOpponentSpeedUpActive = false;
                }, 4000);
                this.updateMultiBallResourceDisplay();
            }
            if (event.key.toLowerCase() === 'arrowleft' && this.opponentGrowPaddleUses > 0) {
                this.opponentGrowPaddleUses--;
                this.gameState.opponent.paddleHeight = this.opponentOriginalPaddleHeight * 2;  // ✅ FIXED: opponent not opponet
                setTimeout(() => {
                    this.gameState.opponent.paddleHeight = this.opponentOriginalPaddleHeight;
                }, 2000);
                this.updateMultiBallResourceDisplay();
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
        const basePaddleSpeed = 5;
        const canvasHeight = GAME_CONFIG.CANVAS.HEIGHT;

        const playerPaddleSpeed = this.isPlayerSpeedUpActive ? basePaddleSpeed * 2 : basePaddleSpeed;
        const opponentPaddleSpeed = this.isOpponentSpeedUpActive ? basePaddleSpeed * 2 : basePaddleSpeed;

        if (this.keysPressed['w']) this.gameState.player.Y -= playerPaddleSpeed;
        if (this.keysPressed['s']) this.gameState.player.Y += playerPaddleSpeed;

        if (this.keysPressed['arrowup']) this.gameState.opponent.Y -= opponentPaddleSpeed;  // ✅ FIXED
        if (this.keysPressed['arrowdown']) this.gameState.opponent.Y += opponentPaddleSpeed;  // ✅ FIXED

        if (this.mode === GAME_MODES.TWOD) {
            if (this.keysPressed['a']) this.gameState.player.X -= playerPaddleSpeed;
            if (this.keysPressed['d']) this.gameState.player.X += playerPaddleSpeed;

            if (this.keysPressed['arrowleft']) this.gameState.opponent.X -= opponentPaddleSpeed;  // ✅ FIXED
            if (this.keysPressed['arrowright']) this.gameState.opponent.X += opponentPaddleSpeed;  // ✅ FIXED

            const midPoint = GAME_CONFIG.CANVAS.WIDTH / 2.05;
            this.gameState.player.X = Math.max(0, Math.min(midPoint - GAME_CONFIG.PADDLE.WIDTH, this.gameState.player.X));
            this.gameState.opponent.X = Math.max(GAME_CONFIG.CANVAS.WIDTH - midPoint, Math.min(GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.WIDTH, this.gameState.opponent.X));  // ✅ FIXED
        }

        this.gameState.player.Y = Math.max(this.gameState.player.paddleHeight / 2, Math.min(canvasHeight - this.gameState.player.paddleHeight / 2, this.gameState.player.Y));
        this.gameState.opponent.Y = Math.max(this.gameState.opponent.paddleHeight / 2, Math.min(canvasHeight - this.gameState.opponent.paddleHeight / 2, this.gameState.opponent.Y));  // ✅ FIXED
    }

    private shootPellet(shooter: 'player' | 'opponent'): void {
        if (this.mode !== GAME_MODES.PELLET || this.gameState.pellets.some(p => p.owner === shooter)) {
            return;
        }

        let paddle: Player;
        let dx: number;

        if (shooter === 'player') {
            if (this.playerPelletsRemaining <= 0) return;
            this.playerPelletsRemaining--;
            paddle = this.gameState.player;
            dx = 20;
        } else {
            if (this.opponentPelletsRemaining <= 0) return;
            this.opponentPelletsRemaining--;
            paddle = this.gameState.opponent;  // ✅ FIXED
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

    private spawnExtraBall(): void {
        if (this.gameState.status !== 'playing') return;

        const speedMultiplier = 0.4;
        const initialSpeedX = GAME_CONFIG.BALL.INITIAL_SPEED.X * speedMultiplier;

        const newBall: Ball = {
            x: GAME_CONFIG.CANVAS.WIDTH / 2,
            y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            vx: Math.random() > 0.5 ? initialSpeedX : -initialSpeedX,  // ✅ FIXED: vx not dx
            vy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,  // ✅ FIXED: vy not dy
        };
        this.gameState.extra_balls.push(newBall);
    }

    private updatePellets(): void {
        if (this.mode !== GAME_MODES.PELLET) return;

        const { pellets, player, opponent } = this.gameState;  // ✅ FIXED

        for (let i = pellets.length - 1; i >= 0; i--) {
            const pellet = pellets[i];
            pellet.x += pellet.dx;

            const targetPaddle = pellet.owner === 'player' ? opponent : player;  // ✅ FIXED
            const paddleTop = targetPaddle.Y - GAME_CONFIG.PADDLE.HEIGHT / 2;
            const paddleBottom = targetPaddle.Y + GAME_CONFIG.PADDLE.HEIGHT / 2;

            if (
                pellet.x >= targetPaddle.X &&
                pellet.x <= targetPaddle.X + GAME_CONFIG.PADDLE.WIDTH &&
                pellet.y >= paddleTop &&
                pellet.y <= paddleBottom
            ) {
                if (pellet.owner === 'player') {
                    this.gameState.player.score++;
                } else {
                    this.gameState.opponent.score++;  // ✅ FIXED
                }
                this.updateScoreboard();
                pellets.splice(i, 1);

                if (this.gameState.player.score >= this.winningScore) this.endGame(this.gameState.player.name);
                if (this.gameState.opponent.score >= this.winningScore) this.endGame(this.gameState.opponent.name);  // ✅ FIXED
                continue;
            }

            if (pellet.x < 0 || pellet.x > GAME_CONFIG.CANVAS.WIDTH) {
                pellets.splice(i, 1);
            }
        }
    }

    private applyMagnetForce(): void {
        if (this.mode !== GAME_MODES.PELLET) return;

        const { ball, player, opponent } = this.gameState;  // ✅ FIXED
        const magnetStrength = 0.4;

        let targetPaddle: Player | null = null;

        if (this.isPlayerMagnetActive) {
            targetPaddle = player;
        } else if (this.isOpponentMagnetActive) {
            targetPaddle = opponent;  // ✅ FIXED
        }

        if (targetPaddle) {
            const vectorX = targetPaddle.X - ball.x;
            const vectorY = targetPaddle.Y - ball.y;
            const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);

            if (distance > 1) {
                const normalizedX = vectorX / distance;
                const normalizedY = vectorY / distance;

                ball.vx += normalizedX * magnetStrength;  // ✅ FIXED: vx not dx
                ball.vy += normalizedY * magnetStrength;  // ✅ FIXED: vy not dy
            }
        }
    }

    private updateBall(): void {
        const { ball, player, opponent } = this.gameState;  // ✅ FIXED
        ball.x += ball.vx;  // ✅ FIXED: vx not dx
        ball.y += ball.vy;  // ✅ FIXED: vy not dy

        if (ball.y + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.HEIGHT || ball.y - GAME_CONFIG.BALL.RADIUS < 0) {
            ball.vy *= -1;  // ✅ FIXED: vy not dy
        }

        this.applyMagnetForce();

        const collidesWithPaddle = (paddle: Player): boolean => {
            const paddleHeight = paddle.paddleHeight;
            const paddleTop = paddle.Y - paddleHeight / 2;
            const paddleBottom = paddle.Y + paddleHeight / 2;
            const paddleLeft = paddle.X;
            const paddleRight = paddle.X + GAME_CONFIG.PADDLE.WIDTH;

            return (
                ball.x + GAME_CONFIG.BALL.RADIUS > paddleLeft &&
                ball.x - GAME_CONFIG.BALL.RADIUS < paddleRight &&
                ball.y + GAME_CONFIG.BALL.RADIUS > paddleTop &&
                ball.y - GAME_CONFIG.BALL.RADIUS < paddleBottom
            );
        };

        if ((ball.vx < 0 && collidesWithPaddle(player)) || (ball.vx > 0 && collidesWithPaddle(opponent))) {  // ✅ FIXED
            const accelerationFactor = this.mode === GAME_MODES.SPEED ? 1.10 : 1.05;
            ball.vx *= -1;  // ✅ FIXED: vx not dx
            ball.vx *= accelerationFactor;
        }

        if (ball.x - GAME_CONFIG.BALL.RADIUS < 0) {
            this.gameState.opponent.score++;  // ✅ FIXED
            this.updateScoreboard();
            if (this.gameState.opponent.score >= this.winningScore) this.endGame(this.gameState.opponent.name);  // ✅ FIXED
            else this.gameState.ball = this.resetBall();
        } else if (ball.x + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.WIDTH) {
            this.gameState.player.score++;
            this.updateScoreboard();
            if (this.gameState.player.score >= this.winningScore) this.endGame(this.gameState.player.name);
            else this.gameState.ball = this.resetBall();
        }
    }

    private updateScoreboard(): void {
        const p1Score = document.getElementById('player1-score');
        const p2Score = document.getElementById('player2-score');
        if (p1Score) p1Score.textContent = this.gameState.player.score.toString();
        if (p2Score) p2Score.textContent = this.gameState.opponent.score.toString();  // ✅ FIXED
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

    private updateMultiBallResourceDisplay(): void {
        if (this.mode !== GAME_MODES.MULTIBALL) return;

        const p1Resources = document.getElementById('player1-abilities');
        const p2Resources = document.getElementById('player2-abilities');

        if (p1Resources) {
            p1Resources.textContent = `Speed (A): ${this.playerSpeedUpUses} | Grow (D): ${this.playerGrowPaddleUses}`;
        }
        if (p2Resources) {
            p2Resources.textContent = `Speed (→): ${this.opponentSpeedUpUses} | Grow (←): ${this.opponentGrowPaddleUses}`;
        }
    }

    private updateExtraBalls(): void {
        if (this.mode !== GAME_MODES.MULTIBALL) return;

        const { extra_balls, player, opponent } = this.gameState;  // ✅ FIXED

        for (let i = extra_balls.length - 1; i >= 0; i--) {
            const ball = extra_balls[i];
            ball.x += ball.vx;  // ✅ FIXED: vx not dx
            ball.y += ball.vy;  // ✅ FIXED: vy not dy

            if (ball.y + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.HEIGHT || ball.y - GAME_CONFIG.BALL.RADIUS < 0) {
                ball.vy *= -1;  // ✅ FIXED: vy not dy
            }

            const collidesWithPaddle = (paddle: Player) => {
                const paddleHeight = paddle.paddleHeight;
                const paddleTop = paddle.Y - paddleHeight / 2;
                const paddleBottom = paddle.Y + paddleHeight / 2;
                const paddleLeft = paddle.X;
                const paddleRight = paddle.X + GAME_CONFIG.PADDLE.WIDTH;
                return ball.x + GAME_CONFIG.BALL.RADIUS > paddleLeft && ball.x - GAME_CONFIG.BALL.RADIUS < paddleRight && ball.y + GAME_CONFIG.BALL.RADIUS > paddleTop && ball.y - GAME_CONFIG.BALL.RADIUS < paddleBottom;
            };

            if ((ball.vx < 0 && collidesWithPaddle(player)) || (ball.vx > 0 && collidesWithPaddle(opponent))) {  // ✅ FIXED
                ball.vx *= -1.05;  // ✅ FIXED: vx not dx
            }

            let scored = false;
            if (ball.x - GAME_CONFIG.BALL.RADIUS < 0) {
                this.gameState.opponent.score++;  // ✅ FIXED
                scored = true;
            } else if (ball.x + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.WIDTH) {
                this.gameState.player.score++;
                scored = true;
            }

            if (scored) {
                this.updateScoreboard();
                extra_balls.splice(i, 1);

                if (this.gameState.player.score >= this.winningScore) {
                    this.endGame(this.gameState.player.name);
                } else if (this.gameState.opponent.score >= this.winningScore) {  // ✅ FIXED
                    this.endGame(this.gameState.opponent.name);
                }
            }
        }
    }

    private gameLoop = (): void => {
        this.renderer.render(this.gameState);

        if (this.gameState.status === 'countdown') {
            const text = this.countdown > 1 ? `${this.countdown - 1}` : 'Go!';
            const context = this.canvas.getContext('2d');
            if (context) {
                context.fillStyle = 'white';
                context.font = '48px Arial';
                context.textAlign = 'center';
                context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
            }
        } else if (this.gameState.status === 'playing') {
            this.updatePellets();
            this.updatePaddles();
            this.updateBall();

            if (this.mode === GAME_MODES.MULTIBALL) {
                this.updateExtraBalls();
            }
            this.drawPellets();
        }

        if (this.gameState.status !== 'finished') {
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
        }
    };

    private drawPellets(): void {
        const context = this.canvas.getContext('2d');
        if (!context || this.mode !== GAME_MODES.PELLET) return;

        context.fillStyle = 'yellow';
        this.gameState.pellets.forEach(pellet => {
            context.beginPath();
            context.arc(pellet.x, pellet.y, 5, 0, Math.PI * 2);
            context.fill();
        });
    }

    private endGame(winner: string): void {
        this.gameState.status = 'finished';
        if (this.multiBallInterval) clearInterval(this.multiBallInterval);
        this.multiBallInterval = null;
        cancelAnimationFrame(this.animationFrameId);
        this.removeEventListeners();
        document.addEventListener('keydown', this.handleGameOverKeyDown);
        this.displayGameOver(winner);
    }

    private displayGameOver(winner: string): void {
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white z-10';

        const winnerText = document.createElement('h2');
        winnerText.className = 'text-5xl font-bold mb-2';
        winnerText.textContent = 'Game Over';

        const subText = document.createElement('p');
        subText.className = 'text-2xl mb-8';
        subText.textContent = `${winner} wins!`;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-4';

        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
        playAgainButton.onclick = () => this.router.navigate(window.location.pathname + window.location.search);

        const selectionButton = document.createElement('button');
        selectionButton.textContent = 'Return to Selection';
        selectionButton.className = 'px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-bold';
        selectionButton.onclick = () => this.router.navigate('/localgame');

        const homeButton = document.createElement('button');
        homeButton.textContent = 'Return Home';
        homeButton.className = 'px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-bold';
        homeButton.onclick = () => this.router.navigate('/desktop');

        buttonContainer.append(playAgainButton, selectionButton, homeButton);
        overlay.append(winnerText, subText, buttonContainer);

        this.gameContainer.appendChild(overlay);
    }

    private handleGameOverKeyDown = (event: KeyboardEvent): void => {
        if (event.code === 'Space') {
            event.preventDefault();
            document.removeEventListener('keydown', this.handleGameOverKeyDown);
            this.router.navigate(window.location.pathname + window.location.search);
        }
    };

    public dispose(): void {
        if (this.multiBallInterval) clearInterval(this.multiBallInterval);
        this.multiBallInterval = null;
        cancelAnimationFrame(this.animationFrameId);
        this.removeEventListeners();
        document.removeEventListener('keydown', this.handleGameOverKeyDown);
        console.log("Local game disposed.");
    }
}