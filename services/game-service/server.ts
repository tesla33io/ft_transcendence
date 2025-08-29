import path from 'path'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import { joinGameHandler, setWebSocketServer } from "./routes/game"
import { GameWebSocketServer } from './types/GameWebsocketServer'

const server = fastify({ logger: true })
const PORT = 5000

const wsServer = new GameWebSocketServer()
setWebSocketServer(wsServer)

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


server.post("/api/join-game", joinGameHandler)

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
