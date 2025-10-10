import { randomBytes } from 'crypto';

export const GAME_HEIGHT = Number(process.env.GAME_HEIGHT || "550")
export const GAME_WIDTH = Number(process.env.GAME_WIDTH || "900")
export const PADDLE_HEIGHT = Number(process.env.PADDLE_HEIGHT || "50")
export const PADDLE_WIDTH = Number(process.env.PADDLE_WIDTH || "10")
export const FPS = Number(process.env.FPS || "60")
export const PLAYER_OFFSET = Number(process.env.PLAYER_OFFSET || "20")

export type GameMode = 'classic' | 'tournament'

export const generateGameId = (): string => {
	return randomBytes(16).toString('hex');
}

export const generatePlayerId = (): string =>{
	return randomBytes(8).toString('hex');
}

export enum GAME_STATE {
	CONNECTED = 0,
	DISCONNECTED = 1,
	WAITING = 2,
	READY = 3,
	PLAYING = 4,
	FINISHED = 5
}

export interface JoinGameRequest {
	playerName: string,
	playerId: string,
	gameMode?: GameMode
}

export interface Player {
		id: string
		name: string
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

export const generateBallPos = (): Ball => {
	let ball = {
		x: Math.floor(Math.random() * GAME_WIDTH),
		y: Math.floor(Math.random() * GAME_HEIGHT),
		vx: Math.floor(Math.random() * 10),
		vy: Math.floor(Math.random() * 10)
	}
	return ball
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





