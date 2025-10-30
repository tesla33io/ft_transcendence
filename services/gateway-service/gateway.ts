import fastify from 'fastify'

const server = fastify({logger: true})
const PORT = 3000

server.register(require('@fastify/cors'),{
	origin:true,
	credentials: true
})

server.get("/test/status", async (req, reply) => {
	return reply.status(200).send({test: 'OK\n'})
})

server.register(require('@fastify/http-proxy'), {
	upstream: 'http://game-service:5000',
	prefix: '/api/v1/game',
	http2: false
})

server.register(require('@fastify/http-proxy'), {
	upstream: 'http://game-service:5005',
	prefix: '/ws/classic',
	websocket: true,
	http2: false
})

server.register(require('@fastify/http-proxy'), {
	upstream: 'http://game-service:5006',
	prefix: '/ws/tournament',
	websocket: true,
	http2: false
})

const start = async() =>{
	try{
		await server.listen({port:PORT, host:'0.0.0.0'})
		console.log(`Gateway server started on port ${PORT}`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()

