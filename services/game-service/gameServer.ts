import fastify from 'fastify'
import { GameMatchmaker} from "./routes/GameMatchmaker"
import { GameServiceManager } from './routes/GameServiceManager'
import { JoinGameRequest, GameMode } from './types/types'

const server = fastify({ logger: true })
const PORT = 5000
const WebsocketPORT = 5005

const gameServiceManager = new GameServiceManager(WebsocketPORT)
const gameMatchmaker = GameMatchmaker.getInstance(gameServiceManager)
gameServiceManager.setMatchmaker(gameMatchmaker)

server.register(require('@fastify/cors'), {
	origin: true,
	credentials: true
})

server.post("/join-classic", async (req, reply) => {
	const result = await gameMatchmaker.joinClassicGame(req.body as JoinGameRequest)
	return result
})

server.post("/join-tournament", async (req, reply) => {
	const result = await gameMatchmaker.joinTournament(req.body as JoinGameRequest)
	return result
})

server.get('/join-classic', async (req, reply) => {
	return { message: 'Use POST method to join game' }
})

server.get("/get-gameMode-port", async (req, reply) =>{
	const url = new URL(req.url!, 'http://game-service')
	const gameMode = url.searchParams.get('gameMode')
	if (gameMode !== 'classic' && gameMode !== 'tournament')
		return {status: 404, port: undefined}
	const result = await gameServiceManager.getGameModePort(gameMode as GameMode)
	return {status: 200, port: result }
})

const start = async () => {
	try {
		await server.listen({ port: PORT, host: '0.0.0.0' })
		console.log(`HTTP Server running on port ${PORT}`)
		console.log(`WebSocket Server running on port ${WebsocketPORT}`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()
