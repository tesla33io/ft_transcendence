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

    SCORE: {//can i probaply delete 
        FONT: '32px Arial',
        OFFSET_Y: 50,
        LEFT_X: 50,
        RIGHT_X: 850
    }

};



//localgame 
export const GAME_MODES = {
    CLASSIC: 'classic',
    SPEED: 'speed',
    PELLET: 'pellet',
    MULTIBALL: 'multiball',
    TWOD: '2d'
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
    gameId?: string;       // Game identifier
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


//user Realted data 
// ===== ENUMS =====
export enum OnlineStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE', 
    IN_GAME = 'IN_GAME',
    BUSY = 'BUSY'
}

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export enum MatchResult {
    WIN = 'WIN',
    LOSS = 'LOSS',
    FORFEIT = 'FORFEIT',
    TIMEOUT = 'TIMEOUT'
}

// ===== USER ENTITY =====
export interface User {
    id: number;
    username: string;
    avatarUrl?: string;
    onlineStatus: OnlineStatus;
    activityType?: string;
    role: UserRole;
    twoFactorEnabled: boolean;
    lastLogin?: string; // ISO date string
}

// Sanitized user data (what frontend actually receives)
export interface PublicUser {
    id: number;
    username: string;
    avatarUrl?: string;
    onlineStatus: OnlineStatus;
    activityType?: string;
    role: UserRole;
    lastLogin?: string;
}

// ===== USER STATISTICS ENTITY =====
export interface UserStatistics {
    userId: number; // Foreign key reference
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    averageGameDuration: number; // in seconds
    longestGame: number; // in seconds
    bestWinStreak: number;
    currentRating: number;
    highestRating: number;
    ratingChange: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    lastGameAt?: string; // ISO date string
}

// ===== MATCH HISTORY ENTITY =====
export interface MatchHistory {
    id: number;
    userId: number; // Foreign key to User
    opponentId: number; // Foreign key to User (opponent)
    tournamentId?: number; // Optional tournament reference
    tournamentWon?: boolean;
    result: MatchResult;
    userScore: number;
    opponentScore: number;
    startTime?: string; // ISO date string
    endTime?: string; // ISO date string
    playedAt: string; // ISO date string
}

// ===== POPULATED/JOINED DATA =====
// When you want user data WITH statistics
export interface UserWithStats {
    user: PublicUser;
    statistics: UserStatistics;
}

// When you want match history WITH user details
export interface MatchHistoryWithUsers {
    id: number;
    user: PublicUser; // Player 1 details
    opponent: PublicUser; // Player 2 details  
    tournamentId?: number;
    tournamentWon?: boolean;
    result: MatchResult;
    userScore: number;
    opponentScore: number;
    startTime?: string;
    endTime?: string;
    playedAt: string;
    gameDuration?: number; // Calculated field (endTime - startTime)
}

// ===== FRONTEND-SPECIFIC INTERFACES =====
// For authentication responses
export interface AuthResponse {
    user: PublicUser;
    token: string;
    refreshToken?: string;
    expiresAt: string;
}

// For login requests
export interface LoginRequest {
    username: string;
    password: string;
    twoFactorCode?: string;
}

// For registration requests  
export interface RegisterRequest {
    username: string;
    password: string;
    avatarUrl?: string;
}

// For profile updates
export interface ProfileUpdateRequest {
    username?: string;
    avatarUrl?: string;
    onlineStatus?: OnlineStatus;
    activityType?: string;
}

// ===== DASHBOARD/SUMMARY DATA =====
// Combined data for profile/dashboard views
export interface UserProfileData {
    profile: PublicUser;
    statistics: UserStatistics;
    recentMatches: MatchHistoryWithUsers[];
}

// ===== API RESPONSE WRAPPERS =====
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}