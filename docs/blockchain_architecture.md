### Blockchain Module Architecture

The Docker container is exiting because `blockchain-service` is just a TypeScript library; once Node finishes compiling it, the process ends with code 0. That’s fine if you intend to ship it as a shared module consumed by `user-service`. If you expect a long-running microservice, you need to add a process (HTTP/WebSocket/queue worker) and set a `CMD` so the container stays alive.

Organize the blockchain module in three layers:

- **Smart contract workspace**: keep a Hardhat/Foundry project (Solidity, deployment scripts, tests) in something like `blockchain/`. Deployment writes ABI + addresses into versioned outputs (e.g. `blockchain/artifacts/TournamentScores.json`).
- **Integration package**: `services/blockchain-service` wraps ethers.js, loads ABI and contract address, exposes `recordTournament`, `verifyTournament`, `getTournament`, `getBalance`. Decide if this stays a pure library (imported by `user-service`) or becomes a microservice with an API.  
  - As a library: publish internally (npm workspace path or private registry) and import directly in Node services; no Docker service required.
  - As a microservice: add an entry point (`src/server.ts`) that mounts routes (e.g. `/tournaments`) and keeps the container running with `CMD ["node","dist/server.js"]`. Other services call it over HTTP.
- **Consumer hooks**: in `user-service` (or whichever backend writes scores), inject the blockchain client. Replace the current mock injection with the real implementation when `NODE_ENV=production`, and call `recordTournament` when a tournament concludes.

### Docker Usage

- **Library mode**: remove `blockchain-service` from `docker-compose` (or leave it but expect the exit). Build/publish the package during CI, install it like any dependency. Production images simply bundle the compiled `dist` output.
- **Microservice mode**: keep a dedicated container. Add health checks, expose a port, and run an HTTP server so the process stays alive. `docker-compose` then starts it alongside the other services. In production you omit bind mounts, rely on the built image, and ensure secrets (`AVALANCHE_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY`, `CONTRACT_ADDRESS`) come from environment variables or a secret manager.

### Suggested File Layout

```
ft_transcendence/
├── blockchain/                     # Hardhat project (Solidity, deployments, tests)
│   ├── contracts/
│   ├── scripts/
│   └── artifacts/                  # Generated ABI + bytecode
├── services/
│   └── blockchain-service/
│       ├── src/
│       │   ├── index.ts            # exports BlockchainService class
│       │   ├── server.ts?          # optional API entry point
│       │   └── contracts/
│       │       └── TournamentScores.json  # copied from blockchain/artifacts
│       ├── package.json
│       └── Dockerfile
```

Automate copying the ABI/address from the contract workspace into the service during build (Hardhat post-compile script or CI step) so the Node code always references the latest deployment.

### Runtime Flow

1. Deploy Solidity contract to Avalanche Fuji (managed via Hardhat). Capture network, contract address, ABI.
2. Build the integration package (TypeScript → dist) with those artifacts embedded or loaded at runtime.
3. `user-service` initializes the blockchain client with env vars and calls `recordTournament` after persisting results to its own DB.
4. Provide a small verification endpoint (either in `user-service` or a dedicated gateway) that calls `verifyTournament`/`getTournament` and surfaces results to the frontend.

This keeps dev ergonomics (bind mounts, hot reload) while ensuring production images are deterministic and only long-running services stay alive.
