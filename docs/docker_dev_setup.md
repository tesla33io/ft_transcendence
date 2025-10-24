# Docker Development Workflow

This document explains the Docker changes that keep hot reload while ensuring the containers install their own dependencies. Everyone working on `frontend`, `gateway-service`, `game-service`, and `user-service` should follow this process.

## Summary of Changes
- **Node versions**: upgraded runtime images to Node 20 (or 22 for the frontend) so packages like Fastify 5, Vite 7, and SQLite binaries run inside Linux containers without engine warnings.
- **Entrypoint scripts**: each service now includes a `docker-entrypoint.sh` that checks whether `node_modules` exists. If the bind mount wiped it out, the script runs `npm install` before starting the dev server.
- **Anonymous volumes**: compose mounts (e.g. `/gateway-service/node_modules`) keep Linux-built dependencies inside the container while still exposing source code through bind mounts for hot reload.
- **User-service listener**: server binds to `0.0.0.0` so traffic from the host reaches it without custom flags.

## Daily Workflow
1. `docker compose build` (use `--no-cache` after dependency changes or Dockerfile edits).
2. `docker compose up`.
3. Watch logs on first boot. You should see lines such as `[frontend] Installing dependencies...`. Subsequent restarts skip reinstallation.
4. Edit code locally; hot reload works through the bind mounts and dev scripts (`vite`, `nodemon`, `tsx`).

## Service Details
- **frontend**
  - Base image: `node:22.18`.
  - Entrypoint runs `npm install` if `/app/node_modules` is missing, then executes `npm run dev`.

- **gateway-service**
  - Base image: `node:20-bullseye`.
  - Entrypoint runs `npm install` against `/gateway-service/node_modules` before launching `npm run dev` (Fastify proxy).

- **game-service**
  - Base image: `node:20-bullseye`.
  - Entrypoint ensures `/game-service/node_modules` is ready, then starts `npm run dev` (nodemon for the websocket server).

- **user-service**
  - Base image: `node:20-bullseye`.
  - Entrypoint prepares `/user-service/node_modules`, preventing mismatched native modules (e.g., `better-sqlite3`).
  - `app.listen` now binds to `0.0.0.0` so curl/Postman from the host reach the service.

## Troubleshooting
- **Dependencies reinstall every run**: ensure the anonymous volume entry (e.g. `/gateway-service/node_modules`) is still present in `docker-compose.yml`.
- **`vite` or `nodemon` still missing**: run `docker compose down -v && docker compose up --build` to clear stale volumes; the entrypoint will repopulate them.
- **SQLite native errors**: remove the host `node_modules` folders and restart the service so the container rebuilds the Linux binary.

## Next Steps / Reminders
- If you add another Node-based service, copy the same entrypoint pattern and anonymous volume into its definition.
- Document any service-specific commands in this file as they evolve.
- Consider wrapping migrations or seeding into similar startup scripts if we need automatic DB preparation.

