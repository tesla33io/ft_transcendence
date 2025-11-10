import { GameMode } from "../types/types"
import { Player } from "../types/interfaces";

export class PlayerQueueManager {
	private waitingPlayers: Map<GameMode, Player[]> = new Map([
		['classic', []],
		['tournament', []]
	]);

	getQueue(gameMode: GameMode): Player[] {
		if (!this.waitingPlayers.has(gameMode)) {
			this.waitingPlayers.set(gameMode, [])
		}
		return this.waitingPlayers.get(gameMode)!
	}

	addPlayer(player: Player, gameMode: GameMode) {
		this.getQueue(gameMode).push(player)
	}

	checkIfPlayerInQ(playerId: string, gameMode: GameMode): boolean{
		const playerList = this.getQueue(gameMode)
		if (!playerId)
			return false

		for (const player of playerList){
			if (playerId == player.id)
				return true
		}
		return false
	}

	removePlayer(playerId: string, gameMode: GameMode): boolean {
		const queue = this.waitingPlayers.get(gameMode);
		if (!queue)
			return false;

		const idx = queue.findIndex(p => p.id === playerId);
		if (idx !== -1) {
			queue.splice(idx, 1)
			return true
		}
			return false
	}
}
