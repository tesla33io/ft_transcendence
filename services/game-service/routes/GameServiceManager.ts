import { GameService } from "./GameService"
import { GameMode } from "../types/types"
import { GameMatchmaker } from "./GameMatchmaker"

export class GameServiceManager{
	private gameServices: Map< GameMode , GameService> = new Map()
	private gameModeToPortNumber: Map<GameMode, number> = new Map()
	private baseSocketNumber: number
	private matchmaker?: GameMatchmaker

	constructor (socketNumber: number){
		this.baseSocketNumber = socketNumber
		this.gameModeToPortNumber.set('classic', 5005)
		this.gameModeToPortNumber.set('tournament', 5006)
	}

	public getMatchmaker(): GameMatchmaker | undefined {
		return this.matchmaker
	}

	public setMatchmaker(matchmaker: GameMatchmaker): void{
		this.matchmaker = matchmaker
	}

	public getGameService(gameMode: GameMode): GameService{
		if (!this.gameServices.has(gameMode)){
			if (!this.matchmaker) {
				throw new Error('Matchmaker not set. Call setMatchmaker() first.')
			}
			const port = this.gameModeToPortNumber.get(gameMode)
			const service = new GameService(this.matchmaker, gameMode, port)
			this.gameServices.set(gameMode, service)

			console.log(`Created ${gameMode} game service on port ${port}`)
		}
		return this.gameServices.get(gameMode)!
	}

	public getGameModePort(gameMode: GameMode): Number | undefined{
		return this.gameModeToPortNumber.get(gameMode)
	}
}
