import path from 'path'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import { req } from 'pino-std-serializers'

const server = fastify({ logger: true })
const PORT = 5000

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

interface Player {
    id: string;
    name: string;
}

interface Game {
    id: string;
    player1: Player;
    player2: Player;
    status: 'waiting' | 'playing' | 'finished';
}

let waitingPlayers: Player[] = []
let activeGame: Game[] = []

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
}

server.post("/api/join-game", async(req, reply) =>{
    const { playerName } = req.body as { playerName: string }

    const player: Player = {
        id: generateId(),
        name: playerName
    };

    console.log(waitingPlayers)

    if (waitingPlayers.length > 0){
        const opponent = waitingPlayers.shift()!
        const game: Game = {
            id: generateId(),
            player1: player,
            player2: opponent,
            status: 'playing'
        };
        activeGame.push(game)
        return {
            status: 'matched',
            gameId: game.id,
            playerId: player.id,
            opponentId: opponent.id
        };
    }
    else{
        waitingPlayers.push(player)
        return {
            status: 'waiting',
            playerId: player.id,
            message: 'Wating for player...'
        }
    }

})

const start = async () => {
	try {
		await server.listen({ port: PORT, host: '0.0.0.0' })
		console.log(`Server running on port ${PORT}`)
	}
	catch (error){
		server.log.error(error)
		process.exit(1)
	}
}

start()
