import { GameService } from "./GameService"
import { GameMode } from "../types/types"
import { GameMatchmaker } from "./GameMatchmaker"

export class GameServiceManager{
	private gameServices: Map< GameMode , GameService> = new Map()
	private baseSocketNumber: number
	private matchmaker?: GameMatchmaker

	constructor (socketNumber: number){
		this.baseSocketNumber = socketNumber
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
			const port = this.baseSocketNumber + this.gameServices.size
			const service = new GameService(this.matchmaker, gameMode, port)
			this.gameServices.set(gameMode, service)
			console.log(`Created ${gameMode} game service on port ${port}`)
		}
		return this.gameServices.get(gameMode)!
	}
}
