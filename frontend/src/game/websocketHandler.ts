import { type GameData,type GameResult, type GameState, MessageType, type WebSocketMessage } from '../types';

export class WebSocketHandler {
    private ws?: WebSocket;
    private gameId: string = '';
	private isReady: boolean = false;
	private tournamentId: string = '';


    constructor(
        private playerId: string,
        private gameMode: string,
        private onGameStart: (data: GameData) => void,
        private onGameUpdate: (state: GameState) => void,
		private onGameResult: (result: GameResult) => void,
        private onError: (message: string) => void,
		private onTournamentNotification?: (data: any) => void
    ) {
        this.connect();
    }

	private isGameState(data: any): data is GameData {
		return(
			data &&
			typeof data === 'object' &&
			data.type === 'classic_notification' &&
            data.status === 'connected'
		);
	}

    private isTournamentNotification(data: any) {
        return (
            data &&
            typeof data === 'object' &&
            data.type === 'tournament_notification' &&
            (data.status === 'ready' || data.status === 'finished')
        )
    }

	private isGameResult(data:any): data is GameResult{
		return(
			data &&
			typeof data === 'object' &&
			data.type === 'classic_notification' &&
			data.status === 'finished'
		)

	}


	private isGameUpdate(data: any): data is GameState {
		return (
			data &&
			typeof data === 'object' &&
			data.type === 'game_state' &&
			data.status === 'playing'
    	);
	}

	public setGameId(id:string){
		this.gameId = id;
		this.isReady = false;
	}

	public setTournamentId(id: string) {
   		this.tournamentId = id;
	}

    public sendReadyMessage(): void {
        //console.log('called send ready msg');
		if (this.isReady) return;

        const readyMsg: WebSocketMessage = {
            type: MessageType.PLAYER_READY,
            gameId: this.gameId,
            playerId: this.playerId
        };
        this.sendMessage(readyMsg);
        this.isReady = true;
    }

    public sendTournamentReady(): void {
        console.log('send Tournament ready message with tournament id',this.tournamentId, 'and player id', this.playerId);
		if (!this.tournamentId) {
            console.error("No tournamentId set for ready message!");
            return;
        }
        const readyMsg = {
            type: MessageType.PLAYER_READY,
            tournamentId: this.tournamentId,
            playerId: this.playerId
        };
        this.sendMessage(readyMsg);
    }

    private handleInitialGameState(data: GameData): void {
        //console.log('=== INITIAL GAME STATE ===');
		// console.log(data)
        this.gameId = data.id || '';
        this.onGameStart(data);
    }

	private handleGameResult(data:any): void{
		const gameResult: GameResult = {
            status: data.status,
            gameMode: data.gameMode,
			myPlayerid: this.playerId,
			player1Score: data.player1Score,
			player2Score: data.player2Score,
			winner: data.winner,
			loser: data.loser
		};

		this.onGameResult(gameResult);
	}

    private handleGameUpdate(data: any): void {
		if (!data.player || !data.opponent || !data.ball) {
            console.error('Invalid game update data:', data);
            return;
        }

        const gameState: GameState = {
            status: data.status,
            gameid: data.gameid,
            player: data.player,
            opponent: data.opponent,
            ball: data.ball
        };

        this.onGameUpdate(gameState);
    }


    private handleWebSocketMessage(rawData: any): void {
        try {
			let data;
        	if(typeof rawData == 'string'){
				data = JSON.parse(rawData); // convert string → object
            	if (typeof data === "string") { //gameUpdate is double-stringified // I got rid of double stringify this was a bug so this can be DELETED
                	data = JSON.parse(data);
            	}
			}
			else{
				data = rawData;
			}
            // if (data && data.type === 'classic_notification')
            //     console.log("Data from server: ", data)
            if (this.isTournamentNotification(data)){
                // console.log("tournament Notification", data);
                if (this.onTournamentNotification) {
                    this.onTournamentNotification(data);
                }
            }
            else if (this.isGameState(data)) {
                this.handleInitialGameState(data);
            }
            else if (this.isGameUpdate(data)) {
                this.handleGameUpdate(data);
            }
			else if(this.isGameResult(data)){
				this.handleGameResult(data);
			}
            else {
                console.warn('Unknown message format:', data);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    // WebSocket connection management
    private connect(): void {
        console.log(`Attempting to connect WebSocket with playerId: ${this.playerId}`);
        this.ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/${this.gameMode}?playerId=${this.playerId}`)

        this.ws.onopen = () => {
            console.log('WebSocket connected successfully');
        };

        this.ws.onmessage = (event: MessageEvent) => {
            // console.log("Websocket msg: ", event.data);
            this.handleWebSocketMessage(event.data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        this.ws.onerror = (error: Event) => {
            console.error('WebSocket error:', error);
            this.onError('Connection failed. Please try again.');
        };
    }

    // Public methods for external use
    public sendMessage(message: WebSocketMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
       } else {
            console.error('WebSocket is not connected');
        }
    }

    public disconnect(): void {
        this.ws?.close();
    }
}
