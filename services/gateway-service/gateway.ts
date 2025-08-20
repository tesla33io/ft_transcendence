import fastify from 'fastify'

const server = fastify({logger: true})
const PORT = 3000

server.register(require('@fastify/cors'),{
	origin:true,
	credentials: true
})


// server.addHook('preHandler', async (request, reply) => {
// 	server.log.info(`Req: ${request.method} \n req: ${request.url}`)
// })

server.get('/test', async (req, reply) => {
	return {message: 'test'}
})

server.register(require('@fastify/http-proxy'), {
	upstream: 'http://game-service:5000',
	prefix: '/api/v1/game',
	http2: false
})

server.register(require('@fastify/http-proxy'), {
	upstream: 'http://game-service:5005',
	prefix: '/ws',
	websocket: true,
	http2: false
})

const start = async() =>{
	try{
		await server.listen({port:PORT, host:'0.0.0.0'})
		console.log(`Gateway server start on port ${PORT}`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()

