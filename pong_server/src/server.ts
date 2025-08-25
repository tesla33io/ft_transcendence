import path, { join } from 'path'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import { joinGameHandler, setWebSocketServer } from "./routes/game"
import { WebSocket, WebSocketServer } from "ws"

const server = fastify({ logger: true })
const PORT = 5000

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 })
const connectedClients = new Map<string, any>()

// Pass WebSocket server to join game handler
setWebSocketServer(wss, connectedClients)

// WebSocket connection handling
wss.on('connection', (ws, req) => {
	const url = new URL(req.url!, 'http://localhost')
	const playerId = url.searchParams.get('playerId')

	if (playerId) {
		connectedClients.set(playerId, ws)
		console.log(`Player ${playerId} connected via WebSocket`)

		ws.on('close', () => {
			connectedClients.delete(playerId)
			console.log(`Player ${playerId} disconnected`)
		})
	}
})

server.register(fastifyStatic,{
	root: path.join(__dirname, 'public'),
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
