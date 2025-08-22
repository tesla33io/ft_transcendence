const path = require('path')

const fastify = require('fastify')({logger: true})
const PORT = 5000

fastify.register(require('@fastify/static'),{
	root: path.join(__dirname, 'public'),
	prefix: '/'
})


fastify.get('/*', (req, reply) => {
	reply.sendFile('index.html')
})


const start = async () => {
	try {
		await fastify.listen({ port: PORT, host: '0.0.0.0' })
		console.log(`Server running on port ${PORT}`)
	}
	catch (error){
		fastify.log.error(error)
		process.exit(1)
	}
}

start()
