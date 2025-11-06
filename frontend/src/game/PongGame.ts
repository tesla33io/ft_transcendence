import { MessageType, type GameState, type GameResult, type GameData } from "../types";
import { Renderer } from "./renderCanvas";
import { WebSocketHandler } from "./websocketHandler";
import { gameView} from "../views/gamePage";
import { Router} from "../router";
import { tournamentRoomView } from "../views/tournamentRoomPage";
import { ApiService } from "./apiService";  // ← ADD THIS IMPORT

export class PongGame {
    private playerName: string;
    private playerId: string;
    private gameMode: string;
    private gameId: string = '';
    private router: Router;
    
    private renderer?: Renderer;
    private wsHandler?: WebSocketHandler;
    private gameView?: ReturnType<typeof gameView>;
    private gameState?: GameState;

    //Store bound functions
    private boundHandleKeyPress: (event: KeyboardEvent) => void;
    private boundHandleKeyRelease: (event: KeyboardEvent) => void;
    
    //Track held keys
    private keysPressed: Map<string, boolean> = new Map();
    
    //Input buffer (updated once per frame)
    private pendingInputDeltaY: number = 0;
    private lastInputDeltaY: number = 0;
    
    //Game loop for synchronized input
    private gameLoopId?: number;
    private lastRenderTime: number = 0;
    private readonly FRAME_TIME: number = 1000 / 60; // ~16.67ms per frame at 60 FPS

    constructor(
        playerName: string,
        playerId: string,
        gameMode: string,
        router: Router
    ) {
        this.playerName = playerName;
        this.playerId = playerId;
        this.gameMode = gameMode;
        this.router = router;
        this.gameId = '';

        //Bind both key handlers
        this.boundHandleKeyPress = this.handleKeyDown.bind(this);
        this.boundHandleKeyRelease = this.handleKeyUp.bind(this);
        this.initializeEventListeners();
    }

    private initializeWebSocket(playerId: string): void {
        this.wsHandler = new WebSocketHandler(
            playerId,
            this.gameMode,
            (data: GameData) => this.handleGameStart(data),
            (state: GameState) => this.handleGameUpdate(state),
            (result: GameResult) => this.handleGameResult(result),
            (message: string) => console.error('Game Error:', message),
            (tournamentData: any) => this.handleTournamentNotification(tournamentData)
        );
    }

    private initializeEventListeners(): void {
        // Separate keydown and keyup for press hold handling
        document.addEventListener("keydown", this.boundHandleKeyPress);
        document.addEventListener("keyup", this.boundHandleKeyRelease);
    }

    // Handle key down (only update key state, don't send immediately)
    private handleKeyDown = (event: KeyboardEvent): void => {
        const key = event.key.toLowerCase();
        
        if (key === 'arrowup' || key === 'arrowdown') {
            event.preventDefault(); // Prevent page scroll
            this.keysPressed.set(key, true);
            //Input will be processed in the game loop
        }
    };

    // Handle key up
    private handleKeyUp = (event: KeyboardEvent): void => {
        const key = event.key.toLowerCase();
        
        if (key === 'arrowup' || key === 'arrowdown') {
            event.preventDefault();
            this.keysPressed.set(key, false);
        }
    };

    // Calculate input for current frame
    private calculateFrameInput(): void {
        let deltaY = 0;

        // Read key state ONCE per frame
        if (this.keysPressed.get('arrowup') === true) {
            deltaY = -10;
        } else if (this.keysPressed.get('arrowdown') === true) {
            deltaY = 10;
        }

        // - Only send if input changed
        if (deltaY !== this.lastInputDeltaY) {
            this.pendingInputDeltaY = deltaY;
            this.lastInputDeltaY = deltaY;
        }
    }

    // Send input (called once per frame)
    private sendInput(): void {
        if (!this.wsHandler || !this.gameId) return;

        // Only send if there's actual movement or it changed
        if (this.pendingInputDeltaY !== 0 || this.lastInputDeltaY !== 0) {
            this.wsHandler.sendMessage({
                type: MessageType.PADDLE_MOVE,
                gameId: this.gameId,
                playerId: this.playerId,
                deltaY: this.pendingInputDeltaY
            });
        }
    }

    async joinGame(): Promise<void> {
        try {
            console.log(`PlayerID: ${this.playerId} - ${this.gameMode}`);
            let apiEndpoint: string;
            if (this.gameMode === 'tournament') {
                apiEndpoint = '/api/v1/game/join-tournament/';
            } else if (this.gameMode === 'ai') {
                apiEndpoint = '/api/v1/game/bot-classic';
                this.gameMode = 'classic';
            } else {
                apiEndpoint = '/api/v1/game/join-classic';
            }

            const data: GameData = await ApiService.post(apiEndpoint, {
                playerName: this.playerName,
                playerId: this.playerId,
                gameMode: this.gameMode,
                timestamp: new Date().toISOString()
            });

            console.log('Join game response:', data);
            this.handleJoinSuccess(data);

        } catch (error) {
            console.error('Join game error:', error);
        }
    }

    private handleJoinSuccess(data: GameData): void {
        console.log('Game data:', data);

        if (data.status === 'waiting') {
            this.initializeWebSocket(data.playerId || this.playerId);
        } else if (data.status === 'connected') {
            this.gameId = data.id || '';
        }
    }

    private handleGameStart(data: GameData): void {
        console.log('Game start received, initializing view...');
        this.gameId = data.id || '';
        if (this.wsHandler) {
            this.wsHandler.setGameId(this.gameId);
        }
        this.router.navigate("/game");

        requestAnimationFrame(() => {
            const oldCanvas = document.getElementById("gameCanvas");
            if (oldCanvas) {
                oldCanvas.remove();
            }
            this.gameView = gameView(this.router);
            if (!this.gameView?.canvas) {
                console.error('Failed to create game view');
                return;
            }
            try {
                this.renderer = new Renderer(this.gameView.canvas);
                this.renderer.initializeCanvas();
                if (this.renderer.isReady() && this.wsHandler) {
                    console.log('View Render ready, sending ready message');
                    this.wsHandler.sendReadyMessage();
                    this.gameView.canvas.style.display = "block";
                    // Start synchronized game loop
                    this.startGameLoop();
                }
            } catch (error) {
                console.error('Failed to initialize renderer:', error);
            }
        });
    }

    //Synchronized game loop (input + render in one frame)
    private startGameLoop(): void {
        const loop = () => {
            const now = Date.now();
            const deltaTime = now - this.lastRenderTime;

            //Only process once per frame (~16.67ms) with a bit of tolerance 
            if (deltaTime >= this.FRAME_TIME * 0.9) {
                this.calculateFrameInput();
                this.sendInput();
                if (this.gameState && this.renderer) {
                    this.renderer.render(this.gameState);
                }
                this.lastRenderTime = now;
            }
            this.gameLoopId = requestAnimationFrame(loop);
        };
        this.lastRenderTime = Date.now();
        this.gameLoopId = requestAnimationFrame(loop);
    }

    private handleGameUpdate(data: GameState): void {
        this.gameState = data;
        this.gameView?.updatePlayers(data.player.name, data.opponent.name);
        this.gameView?.updateScore(data.player.score, data.opponent.score);
    }

    private handleGameResult(data: GameResult): void {
        const isWin = data.winner === this.playerId;
        const finalScore = `${data.player1Score} - ${data.player2Score}`;
        if (this.gameMode !== 'tournament') {
            this.wsHandler?.disconnect();
            this.wsHandler = undefined;
        }
        requestAnimationFrame(() => {
            this.gameView?.showGameResult(isWin, finalScore);

            if (this.gameMode === 'tournament') {
                this.gameView = undefined;
                this.renderer = undefined;
                this.gameState = undefined;
            }
        });
		this.stopGameLoop();
    }

    private handleTournamentNotification(data: any): void {
        console.log('Tournament notification received...');
        this.gameId = data.id || '';
        if (this.wsHandler) {
            this.wsHandler.setTournamentId(data.id);
        }
        this.router.navigate("/tournamentroom");
        requestAnimationFrame(() => {
            tournamentRoomView(this.router, data, this.wsHandler!);
        });
    }

    public dispose(): void {
        document.removeEventListener("keydown", this.boundHandleKeyPress);
        document.removeEventListener("keyup", this.boundHandleKeyRelease);
        
        //- Stop game loop
        this.stopGameLoop();
        
        if (this.gameMode !== "tournament") {
            this.wsHandler?.disconnect();
            this.wsHandler = undefined;
        }
    }
	private stopGameLoop(): void{
		if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = undefined;
        }
	}
}
