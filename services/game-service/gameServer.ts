import fastify from 'fastify'
import { ClassicMatchmaker} from "./routes/classicGameMatchMaker"
import { GameServiceManager } from './routes/GameServiceManager'
import { JoinGameRequest } from './types/types'

const server = fastify({ logger: true })
const PORT = 5000

const gameServiceManager = new GameServiceManager(5001)
const classicMatchmaker = ClassicMatchmaker.getinstance(gameServiceManager)

server.register(require('@fastify/cors'), {
	origin: true,
	credentials: true
})

server.post("/join-classic", async (req, reply) => {
	const result = await classicMatchmaker.joinGameHandler(req.body as JoinGameRequest)
	return result
})

server.post("/join-multiball", async (req, reply) => {
	const result = await classicMatchmaker.joinGameHandler(req.body as JoinGameRequest)
	return result
})

server.post("/join-tournament", async (req, reply) => {

	return { message: 'WIP' }
})

server.get('/join-classic', async (req, reply) => {
	return { message: 'Use POST method to join game' }
})


const start = async () => {
	try {
		await server.listen({ port: PORT, host: '0.0.0.0' })
		console.log(`HTTP Server running on port ${PORT}`)
		console.log(`WebSocket Server running on port 5001`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()
