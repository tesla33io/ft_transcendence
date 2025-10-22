import { GameMode } from "../types/types"
import { JoinGameRequest } from "../types/interfaces"
import { GameServiceManager } from "./GameServiceManager"
import { PlayerQueueManager} from "./PlayerQueueManager"
import { ClassicGameJoiner } from "./GameModeJoiner/ClassicGameJoiner"
import { TournamentGameJoiner } from "./GameModeJoiner/TournamentGameJoiner"
import { BotClassicGameJoiner } from "./GameModeJoiner/BotClassicGameJoiner"
import { GameModeTestCases } from "../test/GameModeTestCases"

export class GameMatchmaker {
	private static instance: GameMatchmaker
	private gameServiceManager: GameServiceManager
	private playerQueueManager: PlayerQueueManager
	private classicJoiner: ClassicGameJoiner
	private tournamentJoiner: TournamentGameJoiner
	private botClassicJoiner: BotClassicGameJoiner
	private gameModeTestCases: GameModeTestCases

	private constructor (serviceManager: GameServiceManager){
		this.gameServiceManager = serviceManager
		this.playerQueueManager = new PlayerQueueManager()
		this.classicJoiner = new ClassicGameJoiner(this.playerQueueManager, this.gameServiceManager)
		this.tournamentJoiner = new TournamentGameJoiner(this.playerQueueManager, this.gameServiceManager)
		this.botClassicJoiner = new BotClassicGameJoiner(this.gameServiceManager)
		this.gameModeTestCases = new GameModeTestCases(this.playerQueueManager, this.gameServiceManager)
	}

	public static getInstance(gameServiceManager: GameServiceManager){
		if (!GameMatchmaker.instance)
				GameMatchmaker.instance = new GameMatchmaker(gameServiceManager)
		return GameMatchmaker.instance
	}

	public removePlayerFromQueue(playerId: string, gameMode: GameMode = 'classic'): boolean{
		return this.playerQueueManager.removePlayer(playerId, gameMode)
	}

	public async joinClassicGame(playerData: JoinGameRequest) {
		return this.classicJoiner.join(playerData)
	}

	public async joinTournament(playerData: JoinGameRequest){
		return this.tournamentJoiner.join(playerData)
	}

	public async joinBotClassic(playerData: JoinGameRequest){
		return this.botClassicJoiner.join(playerData)
	}

	public async test_botInspect(playerData: JoinGameRequest){

	}

	public async test_multipleBotInstance(playerData: JoinGameRequest){
		return this.gameModeTestCases.multipleBotInstance(playerData)
	}

}
