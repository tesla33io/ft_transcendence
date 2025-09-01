export const GAME_HEIGHT = 550
export const GAME_WIDTH = 900

export const generateId = (): string => {
	return Math.random().toString(36).substring(2, 15);
}

export const generatePlayerId = (): string =>{
	return Math.random().toString().substring(2,6);
}


export interface Player {
		id: string
		name: string
		paddleY: number
		paddlyX: number
		score: number
}

export interface Ball {
	x: number
	y: number
	vx: number
	vy: number
}

export const generateBallPos = (): Ball => {
	let ball = {
		x: Math.floor(Math.random() * GAME_HEIGHT),
		y: Math.floor(Math.random() * GAME_WIDTH),
		vx: Math.floor(Math.random() * 10),
		vy: Math.floor(Math.random() * 10)
	}
	return ball
}

export interface Game {
		id: string
		status: 'waiting' | 'playing' | 'finished'
		player1: Player
		player2: Player
		ball: Ball
}




