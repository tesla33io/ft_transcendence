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

server.get("/test", async (req, reply) => {
	return {test: 'OK'}
})

// server.post("/join-classic", async (req, reply) => {
// 	const result = await gameMatchmaker.joinClassicGame(req.body as JoinGameRequest)
// 	return result
// })

server.post("/join-tournament", async (req, reply) => {
	const result = await gameMatchmaker.joinTournament(req.body as JoinGameRequest)
	return result
})
//for testing chage to the join-classic from bot-classic
server.post("/join-classic", async(req, reply) => {
	const result = await gameMatchmaker.joinBotClassic(req.body as JoinGameRequest)
	return result
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
