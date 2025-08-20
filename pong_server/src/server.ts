import Fastify from "fastify";

const server = Fastify({ logger: true });

// Simple test route
server.get("/", async (request, reply) => {
  return { message: "Pong server is running!" };
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
