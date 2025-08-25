export interface Player {
		id: string;
		name: string;
}

export interface Game {
		id: string;
		player1: Player;
		player2: Player;
		status: 'waiting' | 'playing' | 'finished';
}
