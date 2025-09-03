import { ClassicPong } from "./ClassicPong"
import { GameEngine } from "./GameEngine"
import { GameMode } from "../types/types"

export class GameModeEngineProvider {
	public static createEngine(gameMode: GameMode): GameEngine{
		switch (gameMode){
			case 'classic':
				return new ClassicPong()
			case 'tournament':
				//need to be added
			default:
				return new ClassicPong()
		}
	}
}
