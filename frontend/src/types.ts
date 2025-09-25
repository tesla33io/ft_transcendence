// Defines all possible message types for WebSocket communication
export const GAME_CONFIG = {
    CANVAS: {
        WIDTH: 900,
        HEIGHT: 550
    },
    PADDLE: {
        WIDTH: 10,
        HEIGHT: 50,
        OFFSET_FROM_EDGE: 20
    },
    BALL: {
        RADIUS: 10,
        INITIAL_SPEED: {
            X: 5,
            Y: 2
        }
    },
    SCORE: {
        FONT: '32px Arial',
        OFFSET_Y: 50,
        LEFT_X: 50,
        RIGHT_X: 850
    }
};


export enum MessageType {
    GAME_STATE = 'game_state',    // Initial game state message
    GAME_UPDATE = 'game_update',  // Regular game updates
    PLAYER_READY = 'ready',       // Player ready to start
    PADDLE_MOVE = 'paddle_move'   // Paddle movement updates
}

// Interface for initial game setup data
export interface GameData {
    id?: string;           // Unique game identifier
    gameMode?: string;
    status: string;        // Game status (waiting/connected/playing)
    playerId?: string;     // Player's unique identifier
    message?: string;      // Optional status message
    player1?: Player;      // First player data
    player2?: Player;      // Second player data
}

export interface TournamentBracket {
    id: string;
    gameMode: string;
    status: string;
    players: Player[];
    bracket: {
        id: string;
        tournamentId: string;
        status: string;
        player1: Player;
        player2: Player;
        winner: string | null;
    } [];
}

// Interface for ongoing game state
export interface GameState {
    status: string;        // Current game status
    gameid: string;        // Game identifier
    player: Player;        // Current player data
    opponent: Player;       // Opponent data (keeping server's spelling)
    ball: Ball;           // Ball position and velocity
}

// Player information and state
export interface Player {
    id: string;           // Player's unique identifier
    name: string;         // Player's display name
    score: number;        // Current score
	Y: number;      // Paddle Y position
    X: number;      // Paddle X position
    ready: boolean;       // Player ready status
}

// Ball state information
export interface Ball {
    x: number;            // Ball X position
    y: number;            // Ball Y position
    vx: number;           // X velocity
    vy: number;           // Y velocity
}

// WebSocket message format
export interface WebSocketMessage {
    type: string;         // Message type from MessageType enum
    gameId: string;       // Game identifier
    tournamentId?: string;
    playerId: string | number;  // Player identifier
    deltaY?: number;      // Optional paddle movement amount
}


export interface GameResult{
	myPlayerid:  string;
    status?: string,
    gameMode?: string,
	player1Score: number;
	player2Score: number;
	winner: string;
	loser: number;
}
