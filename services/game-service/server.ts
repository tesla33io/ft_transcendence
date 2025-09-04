import path from 'path'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import { GameMatchmaker} from "./routes/game"
import { GameServiceManager } from './routes/GameServiceManager'
import { JoinGameRequest } from './types/types'

const server = fastify({ logger: true })
const PORT = 5000

const gameServiceManager = new GameServiceManager(8080)
const gameMatchmaker = GameMatchmaker.getinstance(gameServiceManager)


server.register(fastifyStatic,{
	root: path.join(__dirname, '../../frontend'),
	prefix: '/'
})

// Handle specific routes that should serve the SPA
server.get('/', async (req, reply) => {
	return await reply.sendFile('index.html')
})

// Handle any route that doesn't match static files (SPA fallback)
server.setNotFoundHandler(async (req, reply) => {
	return await reply.sendFile('index.html')
})


// server.post("/api/join-classic", gameMatchmaker.joinGameHandler)
server.post("/api/join-classic", async (req, reply) => {
	const result = await gameMatchmaker.joinGameHandler(req.body as JoinGameRequest)
	return result
})



const start = async () => {
	try {
		await server.listen({ port: PORT, host: '0.0.0.0' })
		console.log(`HTTP Server running on port ${PORT}`)
		console.log(`WebSocket Server running on port 8080`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()
