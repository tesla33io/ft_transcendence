import { MessageType, type GameState, type GameResult, type GameData } from "../types";
import { Renderer } from "./renderCanvas";
import { WebSocketHandler } from "./websocketHandler";
import { gameView} from "../views/gamePage";
import { Router} from "../router";

export class PongGame {
    // Game state
    private gameId: string = '';
    private playerId: string = '';

    private renderer?: Renderer;
	private gameView?: ReturnType<typeof gameView>;
	private router: Router

    private gameMode: string = '';
    private wsHandler?: WebSocketHandler;
    private gameState?: GameState;

    constructor(
    	private readonly form: HTMLFormElement,
        private readonly playerNameInput: HTMLInputElement,
        private readonly joinBtn: HTMLButtonElement,
        private readonly loading: HTMLElement,
        private readonly errorMessage: HTMLElement,
        private readonly successMessage: HTMLElement,
        private readonly canvas: HTMLCanvasElement,
		router: Router
    ) {
		this.router = router;

 /*       private readonly joinClassicBtn: HTMLButtonElement,
        private readonly joinTournamentBtn: HTMLButtonElement,
        private readonly loading: HTMLElement,
        private readonly errorMessage: HTMLElement,
        private readonly successMessage: HTMLElement,
        private readonly canvas: HTMLCanvasElement
    ) {

        // Initialize game renderer
        this.renderer = new Renderer(this.canvas);
*/
        // Set up event listeners

        this.initializeEventListeners();
    }

    private initializeWebSocket(playerId: string): void {
        this.wsHandler = new WebSocketHandler(
            playerId,
            // Game start callback

            this.gameMode,
            (data: GameData) => this.handleGameStart(data),
            // Game update callback
            (state: GameState) => this.handleGameState(state),
			// on Game end one player win
			(result: GameResult) => this.handleGameResult(result),
            // Error callback
            (message: string) => this.showError(message)
        );
    }

    private initializeEventListeners(): void {

        // Form submission

        // Button-specific event listeners
        this.joinClassicBtn.addEventListener("click", (e: Event) => {
            e.preventDefault();
            this.handleJoinGame('classic');
        });

        this.joinTournamentBtn.addEventListener("click", (e: Event) => {
            e.preventDefault();
            this.handleJoinGame('tournament');
        });


        // Input validation
        this.playerNameInput.addEventListener("input", () => {
            this.validatePlayerName();
        });
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

    private validatePlayerName(): boolean {
        const name = this.playerNameInput.value.trim();
        const isValid = name.length >= 1 && name.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(name);


        this.joinClassicBtn.disabled = !isValid;
        this.joinTournamentBtn.disabled = !isValid;


        if (name.length > 0 && !isValid) {
            this.showError('Name must be 2-20 characters, alphanumeric, underscore, or hyphen only');
        } else {
            this.hideMessages();
        }

        return isValid;
    }


	/*entry point for starting game, Handels api call if succes->handelJoinSuccess function*/
//    public async joinGame(playerName:string): Promise<void> {
//        try {
//            this.setLoadingState(true);
//            this.playerId = Math.random().toString().substring(2,7);
//            console.log('PlayerID: ', this.playerId);

//            const response = await fetch('/api/join-classic', {

    private async handleJoinGame(gameMode = 'classic'): Promise<void> {
        if (!this.validatePlayerName()) {
            this.showError('Please enter a valid player name');
            return;
        }

        const playerName = this.playerNameInput.value.trim();

        try {
			this.form.style.display = 'none';
            this.setLoadingState(true);
            this.playerId = Math.random().toString().substring(2,7);
            console.log(`PlayerID: ${this.playerId} - ${gameMode}`);
            this.gameMode = gameMode;
            const apiEndpoint = gameMode === 'tournament' ? '/api/v1/game/join-tournament' : '/api/v1/game/join-classic'

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName,
                    playerId: this.playerId,

                    gameMode: gameMode,
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
            this.showError(error instanceof Error ? error.message : 'Failed to join game. Please try again.');

        } finally {
            this.setLoadingState(false);
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
            this.showSuccess('Waiting for another player to join...');
            this.initializeWebSocket(data.playerId || this.playerId);
        } else if (data.status === 'connected') {
            this.gameId = data.id || '';
            this.showSuccess('Connecting to game...');

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
            }
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
        }
    });
    }

	private handelGameState(data: GameState): void{
		 // If this is the first game state update (both players ready)
		if (data.status === 'playing' && !this.gameState) {
			// Start the actual game
			this.startGame();
		}
		this.gameState = data;
		this.gameView?.updatePlayers(
			data.player.name,
			data.opponet.name
		)
        this.gameView?.updateScore(
            data.player.score,
            data.opponet.score
        );

        this.renderer?.render(data);
	}

	private handleGameResult(data: GameResult): void{
		const isWin = data.winner === this.playerId;
        const finalScore = `${data.player1Score} - ${data.player2Score}`;
		this.wsHandler?.disconnect();
		 this.wsHandler = undefined;

    	 // render the final game state first
		if (this.gameState) {
			this.renderer?.render(this.gameState);
/* FROM MAIN 
        this.gameId = data.id || '';
        this.showGameMatched(data);
    }

	private handleGameState(data: GameState): void{
		this.gameState = data;
        this.renderer.render(data);
	}

	private handleGameResult(data: GameResult): void{
        console.log("Game result: ", data)
        if (data.status && data.status === 'finished' &&
            data.gameMode && data.gameMode === 'classic'){
                this.wsHandler?.disconnect();
                this.wsHandler = undefined;
            }

    	 // render the final game state first
		if (this.gameState) {
			this.renderer.render(this.gameState);
>>>>>>> origin/main
		*/
		}

		// then schedule the result screen on next frame
		requestAnimationFrame(() => {
			this.gameView.showGameResult(isWin, finalScore);

			// this.renderer.showResultScreen(data, this.playerId);

			//this.renderer.onPlayAgain = () => this.resetGame();
		});
}


    private showGameMatched(data: GameData): void {
        this.showSuccess(`Game found! Players matched - Game starting...`);
        setTimeout(() => this.displayGameInfo(data), 1000);
    }



    private displayGameInfo(data: GameData): void {
        console.log('displayGameInfo running -------------------');
        const gameInfo = `
            <div class="game-info">
                <h3>🎮 PLAYING</h3>
                <div class="players-info">
                    <p><strong>Game ID:</strong> ${data.id}</p>
                    <p><strong>Player :</strong> ${data.player1 ? data.player1.name : 'Unknown'}</p>
                    <p><strong>Opponent :</strong> ${data.player2 ? data.player2.name : 'Unknown'}</p>
                </div>
            </div>
        `;

        this.successMessage.innerHTML = gameInfo;
        this.successMessage.style.display = 'block';
    }

    private startGame(){//gameData: GameData): void {
    // Fade out the game info with animation
    this.successMessage.classList.add('fade-out');

    setTimeout(() => {
        this.successMessage.style.display = 'none';
        this.successMessage.classList.remove('fade-out');
        this.canvas.style.display = 'block';
    }, 1000); // shorter, cleaner transition

    console.log('Game started - both players ready');
	}

    private setLoadingState(isLoading: boolean): void {
        this.loading.style.display = isLoading ? 'block' : 'none';
        this.form.style.display = isLoading ? 'none' : 'block';
        this.hideMessages();
    }

    private showError(message: string): void {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    private showSuccess(message: string): void {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    private hideMessages(): void {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    // Cleanup method
    public dispose(): void {
        this.wsHandler?.disconnect();
        document.removeEventListener("keydown", this.handleKeyPress.bind(this));
    }
}
