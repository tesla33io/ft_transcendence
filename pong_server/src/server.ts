import Fastify from "fastify";

const server = Fastify({ logger: true });

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

let waitingPlayers: Player[] = [];
let activeGames: Game[] = [];

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
}

// Simple test route
server.get("/", async (request, reply) => {
  return { message: "Pong server is running!" };
});

server.post("/api/join", async (request, reply) => {
  const {name: playerName} = request.body as { name: string };

  if (!playerName || playerName.trim().length === 0) {
    return reply.status(400).send({ error: "Name is required" });
  }

  const player: Player = {
    id: generateId(),
    name: playerName.trim(),
  };

  if (waitingPlayers.length > 0){
    const opponent = waitingPlayers.shift()!;
    const game: Game = {
      id: generateId(),
      player1: player,
      player2: opponent,
      status: 'playing'
    };

    activeGames.push(game);

    return {
      staus: 'matched',
      gameId: game.id,
      playerId: player.id,
      opponent: opponent.id
    };
  }
  else{
    waitingPlayers.push(player);

    return {
      status: 'waiting',
      playerId: player.id,
      message: "Waiting for player..."
    };
  }

});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
