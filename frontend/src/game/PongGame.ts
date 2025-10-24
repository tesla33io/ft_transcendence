import { MessageType, type GameState, type GameResult, type GameData } from "../types";
import { Renderer } from "./renderCanvas";
import { WebSocketHandler } from "./websocketHandler";
import { gameView} from "../views/gamePage";
import { Router} from "../router";
import { tournamentRoomView } from "../views/tournamentRoomPage";


export class PongGame {
    private playerName: string;
    private playerId: string;
    private gameMode: string;
    private gameId: string = '';
	private router: Router;
	// External modules
    private renderer?: Renderer;
    private wsHandler?: WebSocketHandler;
    private gameView?: ReturnType<typeof gameView>;
    private gameState?: GameState;

    constructor(
    	playerName: string,
		playerId: string,
		gameMode: string, //classic, Tournament or ai
		router: Router
		
    ) {
		this.playerName = playerName;
		this.playerId = playerId;
		this.gameMode = gameMode;
		this.router = router;
		this.gameId = '';

        this.initializeEventListeners();
    }

    private initializeWebSocket(playerId: string): void {
        this.wsHandler = new WebSocketHandler(
            playerId,
            this.gameMode,
            (data: GameData) => this.handleGameStart(data),
            // Game update callback
            (state: GameState) => this.handleGameUpdate(state),
			// on Game end one player win
			(result: GameResult) => this.handleGameResult(result),

			(message: string) => console.error('Game Error:', message),

			(tournamentData:any) => this.handleTournamentNotification(tournamentData)
        );
    }

    private initializeEventListeners(): void {
        // Paddle movement controls
        document.addEventListener("keydown", this.handleKeyPress.bind(this));
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (!this.wsHandler || !this.gameId) return;

        const deltaY = event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0;
        if (deltaY !== 0) {
            this.wsHandler.sendMessage({
                type: MessageType.PADDLE_MOVE,
                gameId: this.gameId,
                playerId: this.playerId,
                deltaY
            });
        }
    }

     async joinGame(): Promise<void> {
        try {
            console.log(`PlayerID: ${this.playerId} - ${this.gameMode}`);
			let apiEndpoint: string;
			if (this.gameMode === 'tournament') {
				apiEndpoint = '/api/v1/game/join-tournament';
			} else if (this.gameMode === 'ai') {
				apiEndpoint = '/api/v1/game/bot-classic';
				this.gameMode = 'classic';
			} else {
				apiEndpoint = '/api/v1/game/join-classic'; // Default for 'classic' mode
			}
				
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: this.playerName,
                    playerId: this.playerId,

                    gameMode: this.gameMode,
                    timestamp: new Date().toISOString()
                })
            });

            const data: GameData = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to join game');
            }

            this.handleJoinSuccess(data);

        } catch (error) {
            console.error('Join game error:', error);

        }
    }

    private handleJoinSuccess(data: GameData): void {
        console.log('Game data:', data);

        if (data.status === 'waiting') {
            //this.showSuccess('Waiting for another player to join...');
            this.initializeWebSocket(data.playerId || this.playerId);
        } else if (data.status === 'connected') {
            this.gameId = data.id || '';
            //this.showSuccess('Connecting to game...');

        }
    }

    private handleGameStart(data: GameData): void {
		console.log('Game start received, initializing view...');
		this.gameId = data.id || '';
		// Set the game ID in WebSocket handler and reset ready flag
		if (this.wsHandler) {
			this.wsHandler.setGameId(this.gameId);
		}
		// First navigate to game view
		this.router.navigate("/game");
		// Wait for navigation to complete
		requestAnimationFrame(() => {
			// Remove old canvas if it exists
			const oldCanvas = document.getElementById("gameCanvas");
			if (oldCanvas) {
				//console.log("Removing old canvas:", oldCanvas);
				oldCanvas.remove();
			}
			// 3. Create game view
			this.gameView = gameView(this.router);
			// Verify view creation
			if (!this.gameView?.canvas) {
				console.error('Failed to create game view');
				return;
			}
			// Initialize renderer
			try {
				this.renderer = new Renderer(this.gameView.canvas);
				this.renderer.initializeCanvas();
				// Send ready message only after everything is set up
				if (this.renderer.isReady() && this.wsHandler) {
					console.log('View Render ready, sending ready message');
					this.wsHandler.sendReadyMessage();
					this.gameView.canvas.style.display = "block";
				}
			} catch (error) {
				console.error('Failed to initialize renderer:', error);
			}
		});
    }

	private handleGameUpdate(data: GameState): void{
		//console.log("Game update received:", data);
		this.gameState = data;
		this.gameView?.updatePlayers(
			data.player.name,
			data.opponent.name
		)
        this.gameView?.updateScore(
            data.player.score,
            data.opponent.score
        );

        this.renderer?.render(data);
	}

	private handleGameResult(data: GameResult): void{
		const isWin = data.winner === this.playerId;
        const finalScore = `${data.player1Score} - ${data.player2Score}`;
		if(this.gameMode != 'tournament'){
			this.wsHandler?.disconnect();
			this.wsHandler = undefined;
		}
    	 // render the final game state first
		if (this.gameState) {
			this.renderer?.render(this.gameState);
		}
		// then schedule the result screen on next frame
		requestAnimationFrame(() => {
			this.gameView?.showGameResult(isWin, finalScore);

			if (this.gameMode === 'tournament') {
				this.gameView = undefined;
				this.renderer = undefined;
				this.gameState = undefined;
			}
		});
	}


	private handleTournamentNotification(data: any): void {
		console.log('Tournament notification received, initializing tournament room...');
		// Save tournament id if needed
		this.gameId = data.id || '';
		if (this.wsHandler) {
       		this.wsHandler.setTournamentId(data.id);
    	}
		// Navigate to the tournament room page
		this.router.navigate("/tournamentroom");
		// Wait for navigation to complete, then render the room
		requestAnimationFrame(() => {
			tournamentRoomView(this.router, data, this.wsHandler!);
		});
	}

    // Cleanup method
   public dispose(): void {
    // Only disconnect if not in tournament mode
    if (this.gameMode !== "tournament") {
			this.wsHandler?.disconnect();
			this.wsHandler = undefined;
		}
		document.removeEventListener("keydown", this.handleKeyPress.bind(this));
	}
}
