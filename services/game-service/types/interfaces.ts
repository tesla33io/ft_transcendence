import { GameMode } from "./types"

export interface JoinGameRequest {
	playerName: string,
	playerId: string,
	gameMode?: GameMode,
	aiBotMode?: boolean,
	sessionId?: string
}

export interface User {
	id: string
	sessionId: string
	name: string
}

export interface Player extends User {
	Y: number
	X: number
	score: number
	ready: boolean
}

export interface Ball {
	x: number
	y: number
	vx: number
	vy: number
}

export interface Game {
		id: string
		gameMode: string
		status: 'waiting' | 'playing' | 'finished' | 'ready' | 'connected'
		player1: Player
		player2: Player
		ball: Ball
}

export interface Tournament {
	id: string
	status: 'waiting' | 'playing' | 'finished' | 'ready' | 'connected'
	players: Player[]
	bracket: TournamentMatch[]
	winner: Player | null
}

export interface TournamentMatch {
	id: string
	tournamentId: string
	status: 'waiting' | 'playing' | 'finished' | 'ready' | 'connected'
	player1: Player
	player2: Player
	winner: Player | null
}
