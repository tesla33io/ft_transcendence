import { type GameData,type GameResult, type GameState, MessageType, type WebSocketMessage } from '../types';
import { Renderer } from "./renderCanvas";

export class WebSocketHandler {
    private ws?: WebSocket;
    private gameId: string = '';

    constructor(
        private playerId: string,
        private onGameStart: (data: GameData) => void,
        private onGameUpdate: (state: GameState) => void,
		private onGameResult: (result: GameResult) => void,
        private onError: (message: string) => void
    ) {
        this.connect();
    }

	private isGameState(data: any): data is GameData {
		return(
			data &&
			typeof data === 'object' &&
			'status' in data &&
			'id' in data &&
			'player1' in data &&
			'player2' in data
		);
	}

	private isGameResult(data:any): data is GameResult{
		return(
			data &&
			typeof data === 'object' &&
			'player1Score' in data &&
			'player2Score' in data &&
			'winner' in data
			// 'loser' in data
		)

	}


	private isGameUpdate(data: any): data is GameState {
		    return (
        data &&
        typeof data === 'object' &&
        'status' in data &&
        //'gameid' in data &&
        'player' in data &&
        'opponet' in data && // Note: keeping the misspelling to match server
        'ball' in data
    );
	}

    // Handle different types of messages
    private handleInitialGameState(data: GameData): void {
        console.log('=== INITIAL GAME STATE ===');
        this.gameId = data.id || '';
        this.onGameStart(data);

        // Send ready message
        const readyMsg: WebSocketMessage = {
            type: MessageType.PLAYER_READY,
            gameId: this.gameId,
            playerId: this.playerId
        };
        setTimeout(() => this.sendMessage(readyMsg), 1000);
    }

	private handleGameResult(data:any): void{
		const gameResult: GameResult = {
			myPlayerid: this.playerId,
			player1Score: data.player1Score,
			player2Score: data.player2Score,
			winner: data.winner,
			losser: data.losser //loser: data.loser
		};

		this.onGameResult(gameResult);
	}

    private handleGameUpdate(data: any): void {
        if (!data.player || !data.opponet || !data.ball) {
            console.error('Invalid game update data:', data);
            return;
        }

        const gameState: GameState = {
            status: data.status,
            gameid: data.gameid,
            player: data.player,
            opponet: data.opponet,
            ball: data.ball
        };

        this.onGameUpdate(gameState);
    }

    private handleWebSocketMessage(rawData: any): void {
        try {
			let data;
        	if(typeof rawData == 'string'){
				data = JSON.parse(rawData); // convert string → object
            	if (typeof data === "string") { //gameUpdate is double-stringified
                	data = JSON.parse(data);
            	}
			}
			else{
				data = rawData;
			}

            if (this.isGameState(data)) {
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
        this.ws = new WebSocket(`ws://${window.location.hostname}:3000/ws?playerId=${this.playerId}`)

        this.ws.onopen = () => {
            console.log('WebSocket connected successfully');
        };

        this.ws.onmessage = (event: MessageEvent) => {
            console.log("Websocket msg: ", event.data);
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
            console.log('Sent to server:', message);
        } else {
            console.error('WebSocket is not connected');
        }
    }

    public disconnect(): void {
        this.ws?.close();
    }
}
