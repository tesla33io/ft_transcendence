import { Renderer } from './renderCanvas';
import { GAME_CONFIG, type GameState, type Paddle, type Ball } from '../types';
import { Router } from '../router';
import { GAME_MODES } from '../constants';

interface Pellet {
    x: number;
    y: number;
    dx: number;
    owner: 'player' | 'opponent';
}

type ExtendedGameState = Omit<GameState, 'player' | 'opponet'> & { player: Player & { paddleHeight: number }, opponet: Player & { paddleHeight: number }, pellets: Pellet[], extra_balls: Ball[] };

export class LocalPongGame {
    private renderer: Renderer;
    private gameState: ExtendedGameState;
    private keysPressed: { [key: string]: boolean } = {};
    private animationFrameId: number = 0;
    private isPlayerMagnetActive: boolean = false;
    private isOpponentMagnetActive: boolean = false;
    private playerPelletsRemaining: number;
    private opponentPelletsRemaining: number;
    private playerMagnetUsesRemaining: number;
    private opponentMagnetUsesRemaining: number;
    private multiBallInterval: number | null = null;

    // Multi-ball mode abilities state
    private playerSpeedUpUses: number;
    private opponentSpeedUpUses: number;
    private playerGrowPaddleUses: number;
    private opponentGrowPaddleUses: number;
    private isPlayerSpeedUpActive: boolean = false;
    private isOpponentSpeedUpActive: boolean = false;
    private playerOriginalPaddleHeight: number = GAME_CONFIG.PADDLE.HEIGHT;
    private opponentOriginalPaddleHeight: number = GAME_CONFIG.PADDLE.HEIGHT;

    // Countdown state
    private countdown: number = 3; // 3, 2, 1...

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

    private createInitialState(): ExtendedGameState {
        return {
            status: 'countdown', // Start in countdown mode
            gameid: 'local',
            player: {
                name: 'Player 1',
                score: 0,
                X: GAME_CONFIG.PADDLE.OFFSET_FROM_EDGE,
                Y: GAME_CONFIG.CANVAS.HEIGHT / 2,
                paddleHeight: GAME_CONFIG.PADDLE.HEIGHT,
            },
            opponet: {
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
            dx: Math.random() > 0.5 ? initialSpeedX : -initialSpeedX,
            dy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,
        };
    }

    public start(): void {
        this.renderer.initializeCanvas();
        this.updateResourceDisplay(); // Ensure initial resource counts are shown
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
        }, 1000); // User requested 2 seconds, so 3 ticks: 2, 1, start.
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
        } else if (this.mode === GAME_MODES.MULTIBALL) {
            // Player 1 abilities
            if (event.key.toLowerCase() === 'a' && this.playerSpeedUpUses > 0) {
                this.playerSpeedUpUses--;
                this.isPlayerSpeedUpActive = true;
                console.log("Player 1 Speed Up activated!");
                setTimeout(() => {
                    this.isPlayerSpeedUpActive = false;
                    console.log("Player 1 Speed Up deactivated.");
                }, 4000); // 4 seconds
                this.updateMultiBallResourceDisplay();
            }
            if (event.key.toLowerCase() === 'd' && this.playerGrowPaddleUses > 0) {
                this.playerGrowPaddleUses--;
                this.gameState.player.paddleHeight = this.playerOriginalPaddleHeight * 2; // 100% bigger
                console.log("Player 1 Grow Paddle activated!");
                setTimeout(() => {
                    this.gameState.player.paddleHeight = this.playerOriginalPaddleHeight;
                    console.log("Player 1 Grow Paddle deactivated.");
                }, 2000); // 2 seconds
                this.updateMultiBallResourceDisplay();
            }

            // Player 2 abilities
            if (event.key.toLowerCase() === 'arrowright' && this.opponentSpeedUpUses > 0) {
                this.opponentSpeedUpUses--;
                this.isOpponentSpeedUpActive = true;
                console.log("Player 2 Speed Up activated!");
                setTimeout(() => {
                    this.isOpponentSpeedUpActive = false;
                    console.log("Player 2 Speed Up deactivated.");
                }, 4000); // 4 seconds
                this.updateMultiBallResourceDisplay();
            }
            if (event.key.toLowerCase() === 'arrowleft' && this.opponentGrowPaddleUses > 0) {
                this.opponentGrowPaddleUses--;
                this.gameState.opponet.paddleHeight = this.opponentOriginalPaddleHeight * 2; // 100% bigger
                console.log("Player 2 Grow Paddle activated!");
                setTimeout(() => {
                    this.gameState.opponet.paddleHeight = this.opponentOriginalPaddleHeight;
                    console.log("Player 2 Grow Paddle deactivated.");
                }, 2000); // 2 seconds
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

        // Player 1 (W/S)
        if (this.keysPressed['w']) {
            this.gameState.player.Y -= playerPaddleSpeed;
        }
        if (this.keysPressed['s']) {
            this.gameState.player.Y += playerPaddleSpeed;
        }

        // Player 2 (ArrowUp/ArrowDown)
        if (this.keysPressed['arrowup']) {
            this.gameState.opponet.Y -= opponentPaddleSpeed;
        }
        if (this.keysPressed['arrowdown']) {
            this.gameState.opponet.Y += opponentPaddleSpeed;
        }

        // Horizontal movement for 2D mode
        if (this.mode === GAME_MODES.TWOD) {
            // Player 1 (A/D)
            if (this.keysPressed['a']) {
                this.gameState.player.X -= playerPaddleSpeed;
            }
            if (this.keysPressed['d']) {
                this.gameState.player.X += playerPaddleSpeed;
            }

            // Player 2 (ArrowLeft/ArrowRight)
            if (this.keysPressed['arrowleft']) {
                this.gameState.opponet.X -= opponentPaddleSpeed;
            }
            if (this.keysPressed['arrowright']) {
                this.gameState.opponet.X += opponentPaddleSpeed;
            }

            // Clamp horizontal positions for 2D mode
            const midPoint = GAME_CONFIG.CANVAS.WIDTH / 2.05; // Use 2.05 to create a gap from the true center
            this.gameState.player.X = Math.max(0, Math.min(midPoint - GAME_CONFIG.PADDLE.WIDTH, this.gameState.player.X));
            this.gameState.opponet.X = Math.max(GAME_CONFIG.CANVAS.WIDTH - midPoint, Math.min(GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.WIDTH, this.gameState.opponet.X));
        }

        // Clamp paddle positions to stay within the canvas
        this.gameState.player.Y = Math.max(this.gameState.player.paddleHeight / 2, Math.min(canvasHeight - this.gameState.player.paddleHeight / 2, this.gameState.player.Y));
        this.gameState.opponet.Y = Math.max(this.gameState.opponet.paddleHeight / 2, Math.min(canvasHeight - this.gameState.opponet.paddleHeight / 2, this.gameState.opponet.Y));
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

    private spawnExtraBall(): void {
        if (this.gameState.status !== 'playing') return;

        const speedMultiplier = 0.4; // As requested
        const initialSpeedX = GAME_CONFIG.BALL.INITIAL_SPEED.X * speedMultiplier;

        const newBall: Ball = {
            x: GAME_CONFIG.CANVAS.WIDTH / 2,
            y: GAME_CONFIG.CANVAS.HEIGHT / 2,
            dx: Math.random() > 0.5 ? initialSpeedX : -initialSpeedX,
            dy: (Math.random() - 0.5) * GAME_CONFIG.BALL.INITIAL_SPEED.Y * 2,
        };
        this.gameState.extra_balls.push(newBall);
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
            const paddleHeight = (paddle === player) ? player.paddleHeight : opponet.paddleHeight;
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
            if (this.gameState.opponet.score >= this.winningScore) this.endGame(this.gameState.opponet.name);
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

        const { extra_balls, player, opponet } = this.gameState;

        for (let i = extra_balls.length - 1; i >= 0; i--) {
            const ball = extra_balls[i];
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collision
            if (ball.y + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.HEIGHT || ball.y - GAME_CONFIG.BALL.RADIUS < 0) {
                ball.dy *= -1;
            }

            // Paddle collision
            const collidesWithPaddle = (paddle: Paddle) => {
                const paddleHeight = (paddle === player) ? player.paddleHeight : opponet.paddleHeight;
                const paddleTop = paddle.Y - paddleHeight / 2;
                const paddleBottom = paddle.Y + paddleHeight / 2;
                const paddleLeft = paddle.X;
                const paddleRight = paddle.X + GAME_CONFIG.PADDLE.WIDTH;
                return ball.x + GAME_CONFIG.BALL.RADIUS > paddleLeft && ball.x - GAME_CONFIG.BALL.RADIUS < paddleRight && ball.y + GAME_CONFIG.BALL.RADIUS > paddleTop && ball.y - GAME_CONFIG.BALL.RADIUS < paddleBottom;
            };

            if ((ball.dx < 0 && collidesWithPaddle(player)) || (ball.dx > 0 && collidesWithPaddle(opponet))) {
                ball.dx *= -1.05; // Slightly accelerate on hit
            }

            // Score update when ball goes past a paddle
            let scored = false;
            if (ball.x - GAME_CONFIG.BALL.RADIUS < 0) {
                this.gameState.opponet.score++;
                scored = true;
            } else if (ball.x + GAME_CONFIG.BALL.RADIUS > GAME_CONFIG.CANVAS.WIDTH) {
                this.gameState.player.score++;
                scored = true;
            }

            if (scored) {
                this.updateScoreboard();
                extra_balls.splice(i, 1);

                // Check for win condition after scoring
                if (this.gameState.player.score >= this.winningScore) {
                    this.endGame(this.gameState.player.name);
                } else if (this.gameState.opponet.score >= this.winningScore) {
                    this.endGame(this.gameState.opponet.name);
                }
            }
        }
    }

    private gameLoop = (): void => {
        // Always render the current state
        this.renderer.render(this.gameState);

        if (this.gameState.status === 'countdown') {
            const text = this.countdown > 1 ? `${this.countdown - 1}` : 'Go!';
            this.renderer.drawText(text, this.canvas.width / 2, this.canvas.height / 2 - 80);
        } else if (this.gameState.status === 'playing') {
            this.updatePellets();
            this.updatePaddles();
            this.updateBall();

            if (this.mode === GAME_MODES.MULTIBALL) {
                this.updateExtraBalls();
            }
            this.drawPellets(); // Drawing pellets after the main render
        }

        // Continue the loop as long as the game is not finished
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
            context.arc(pellet.x, pellet.y, 5, 0, Math.PI * 2); // 5px radius pellet
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
        const context = this.canvas.getContext('2d');
        if (!context) return;
    
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white z-10';
    
        // Winner text
        const winnerText = document.createElement('h2');
        winnerText.className = 'text-5xl font-bold mb-2';
        winnerText.textContent = 'Game Over';
    
        const subText = document.createElement('p');
        subText.className = 'text-2xl mb-8';
        subText.textContent = `${winner} wins!`;
    
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-4';
    
        // Play Again button
        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold';
        playAgainButton.onclick = () => this.router.navigate(window.location.pathname + window.location.search);
    
        // Return to Selection button
        const selectionButton = document.createElement('button');
        selectionButton.textContent = 'Return to Selection';
        selectionButton.className = 'px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-bold';
        selectionButton.onclick = () => this.router.navigate('/localgame');
    
        // Return Home button
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
            // Remove the listener to prevent multiple triggers
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