import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { GameMatchmaker} from "./routes/GameMatchmaker"
import { GameServiceManager } from './routes/GameServiceManager'
import { JoinGameRequest } from './types/interfaces'
import { validateSessionId } from './types/types'

const server = fastify({ logger: true })
server.register(cookie)
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
	return reply.status(201).send(result)
})

server.post("/join-tournament", async (req, reply) => {
	const result = await gameMatchmaker.joinTournament(req.body as JoinGameRequest)
	return reply.status(201).send(result)
})

server.post("/bot-classic", async(req, reply) => {

	const body = req.body as JoinGameRequest
	const sessionId = req.cookies.sessionId

	console.log("Cookie: ", req.cookies)

	const joinRequest: JoinGameRequest = {
		...body,
		sessionId
	}

	if (!((await fetch("http://ai-service:5100/api/v1/aibot/test/status")).ok)){
		let errorMsg = "something" //TO DO
		return reply.status(503).send(errorMsg)
	}
	const result = await gameMatchmaker.joinBotClassic(joinRequest)
	return reply.status(201).send(result)
})

server.get("/test/status", async (req, reply) => {
	return reply.status(200).send({status: 'OK'})
})

server.get("/test/checkNumberBotInstance", async (req, reply) => {
	const response = await fetch("http://ai-service:5100/api/v1/aibot/numbers-of-bots")

	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}
	return response
})

server.post("/test/multipleInstance", async (req, reply) => {
	const result = await gameMatchmaker.test_multipleBotInstance(req.body as JoinGameRequest)
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
