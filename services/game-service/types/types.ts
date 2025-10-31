import {Player, Ball, Game} from "./interfaces"
import { randomBytes } from 'crypto';

export const GAME_HEIGHT = Number(process.env.GAME_HEIGHT || "550")
export const GAME_WIDTH = Number(process.env.GAME_WIDTH || "900")
export const PADDLE_HEIGHT = Number(process.env.PADDLE_HEIGHT || "50")
export const PADDLE_WIDTH = Number(process.env.PADDLE_WIDTH || "10")
export const FPS = Number(process.env.FPS || "60")
export const PLAYER_OFFSET = Number(process.env.PLAYER_OFFSET || "20")

export type GameMode = 'classic' | 'tournament' | 'bot-classic'

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

export const generateBallPos = (): Ball => {
	let ball = {
		x: Math.floor(Math.random() * GAME_WIDTH),
		y: Math.floor(Math.random() * GAME_HEIGHT),
		vx: Math.floor(Math.random() * 10),
		vy: Math.floor(Math.random() * 10)
	}
	return ball
}

export const generateDefaultPlayer = (playerName: string, playerId: string): Player => {
	let player: Player = {
		id: playerId,
		name: playerName,
		score: 0,
		Y: 0,
		X: 0,
		ready: false
	}
	return player
}

export const generateDefaultGame = (opponent: Player, player: Player): Game =>{
	const game: Game ={
		id: generateGameId(),
		gameMode: 'classic',
		status: 'connected',
		player1: opponent,
		player2: player,
		ball: generateBallPos()
	};
	return game;
}

export const generateBot = async (nameSuffix: string, gameId: string, difficulty: string): Promise<string> => {
	const response = await fetch ('http://ai-service:5100/api/v1/aibot/get-bot/classic', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({nameSuffix: `${nameSuffix}`, gameId: `${gameId}`, difficulty: 'easy'})
			})

			if (!response.ok){
				throw new Error('Failed to generate bot')
			}

	const data = await response.json()
	const botId: string = data.botId
	return botId
}

export const validateUserData = async(): Promise<boolean> => {


	return true
}


export type WaitingResponse = {
	status: 'waiting';
	playerId: string;
	gameId?: string;
	message: string;
};



