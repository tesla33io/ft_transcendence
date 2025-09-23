import { ClassicPong } from "./ClassicPong"
import { GameEngine } from "./GameEngine"
import { GameMode } from "../types/types"
import { TournamentPong } from "./TournamentPong"

export class GameModeEngineProvider {
	public static createEngine(gameMode: GameMode): GameEngine{
		switch (gameMode){
			case 'classic':
				return new ClassicPong()
			case 'tournament':
				return new TournamentPong()
			default:
				return new ClassicPong()
		}
	}
}
