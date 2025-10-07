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
	private canvas: HTMLCanvasElement;
	private router: Router;
	// External modules
    private renderer?: Renderer;
    private wsHandler?: WebSocketHandler;
    private gameView?: ReturnType<typeof gameView>;
    private gameState?: GameState;

    constructor(
    	playerName: string,
		playerId: string,
		gameMode: string, //classic or Tournament
        canvas: HTMLCanvasElement,
		router: Router
		
    ) {
		this.playerName = playerName;
		this.playerId = playerId;
		this.gameMode = gameMode;
		this.canvas = canvas;
		this.router = router;
		this.gameId = '';

        this.initializeEventListeners();
    }

    private initializeWebSocket(playerId: string): void {
        this.wsHandler = new WebSocketHandler(
            playerId,
            // Game start callback

            this.gameMode,
            (data: GameData) => this.handleGameStart(data),
            // Game update callback
            (state: GameState) => this.handleGameUpdate(state),
			// on Game end one player win
			(result: GameResult) => this.handleGameResult(result),

			(message: string) => this.showError(message),

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


	/*entry point for starting game, Handels api call if succes->handelJoinSuccess function*/
//    public async joinGame(playerName:string): Promise<void> {
//        try {
//            this.setLoadingState(true);
//            this.playerId = Math.random().toString().substring(2,7);
//            console.log('PlayerID: ', this.playerId);

//            const response = await fetch('/api/join-classic', {

     async joinGame(): Promise<void> {
        try {
            console.log(`PlayerID: ${this.playerId} - ${this.gameMode}`);
            const apiEndpoint = this.gameMode === 'tournament' ? '/api/v1/game/join-tournament' : '/api/v1/game/join-classic'

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

        } finally {
            //this.setLoadingState(false);
        }
    }


	//manages game state transition and init websocket
//    private handleJoinSuccess(data: GameData): void {
//        console.log('Game data:', data);
//        if (data.status === 'waiting') {
//            this.showSuccess('Waiting for another player to join...');
//            this.initializeWebSocket(data.playerId || this.playerId);

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

    // First navigate to game view
    this.router.navigate("/game");

    // Wait for navigation to complete
    requestAnimationFrame(() => {
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

            // Show match info
            this.showGameMatched(data);

            // Send ready message only after everything is set up
            if (this.renderer.isReady() && this.wsHandler) {
                console.log('View ready, sending ready message');
                this.wsHandler.sendReadyMessage();
				this.canvas.style.display = "block";
            }
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
        }
    });
    }

	private handleGameUpdate(data: GameState): void{
		 // If this is the first game state update (both players ready)
		if (data.status === 'playing' && !this.gameState) {
			// Start the actual game
			this.startGame();
		}
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
			this.gameView.showGameResult(isWin, finalScore);
		});
}


    private showGameMatched(data: GameData): void {
        //this.showSuccess(`Game found! Players matched - Game starting...`);
        //setTimeout(() => this.displayGameInfo(data), 1000);
		console.log('game matched');
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


    private startGame(){//gameData: GameData): void {
    // Fade out the game info with animation
    //his.successMessage.classList.add('fade-out');

    setTimeout(() => {
        //this.successMessage.style.display = 'none';
        //this.successMessage.classList.remove('fade-out');
        this.canvas.style.display = 'block';
    }, 1000); // shorter, cleaner transition

    console.log('Game started - both players ready');
	}


    // Cleanup method
    public dispose(): void {
        this.wsHandler?.disconnect();
        document.removeEventListener("keydown", this.handleKeyPress.bind(this));
    }
}
