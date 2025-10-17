import { GameMode } from "../types/types"
import { Player } from "../types/interfaces";

export class PlayerQueueManager {
	private waitingPlayers: Map<GameMode, Player[]> = new Map([
		['classic', []],
		['tournament', []]
	]);

	getQueue(gameMode: GameMode): Player[] {
		if (!this.waitingPlayers.has(gameMode)) {
		this.waitingPlayers.set(gameMode, []);
		}
		return this.waitingPlayers.get(gameMode)!;
	}

	addPlayer(player: Player, gameMode: GameMode) {
		this.getQueue(gameMode).push(player);
	}

	removePlayer(playerId: string, gameMode: GameMode): boolean {
		const queue = this.waitingPlayers.get(gameMode);
		if (!queue) return false;

		const idx = queue.findIndex(p => p.id === playerId);
		if (idx !== -1) {
		queue.splice(idx, 1);
		return true;
		}
		return false;
	}
}
