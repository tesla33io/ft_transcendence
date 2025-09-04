import { GameService } from "./GameService"
import { GameMode } from "../types/types"

export class GameServiceManager{
	private gameServices: Map< GameMode , GameService> = new Map()
	private baseSocketNumber: number

	constructor (sockerNumber: number){
		this.baseSocketNumber = sockerNumber
	}

	public getGameService(gameMode: GameMode): GameService{
		if (!this.gameServices.has(gameMode)){
			const port = this.baseSocketNumber + this.gameServices.size
			const service = new GameService(gameMode, port)
			this.gameServices.set(gameMode, service)
			console.log(`Created ${gameMode} game service on port ${port}`)
		}
		return this.gameServices.get(gameMode)!
	}
}
