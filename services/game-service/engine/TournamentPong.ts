import { Game, GAME_HEIGHT, GAME_WIDTH } from "../types/types";
import { GameEngine } from "./GameEngine";

/**
 Maybe TournamentPong will be the extention of the Classicpong
 then just make the logic to par the winners until there will be
 only one player left
 */

export class TournamentPong extends GameEngine{

	public initializeGameState(game: Game): void {

	}

	protected updateGame(game: Game): void {

	}

	public updatePlayerPaddle(gameId: string, playerId: string, paddleY: number): void {

	}

	public allPlayerReady(gameId: string, playerId: string): boolean {
		return false
	}
}
