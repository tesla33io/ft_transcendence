FROM node:20-bookworm AS deps

WORKDIR /user-service

COPY user-service/package*.json ./
RUN npm ci

FROM deps AS build
COPY user-service/ ./
# Now blockchain-service is accessible
COPY blockchain-service ./blockchain-service
# Build blockchain-service first - install deps and build
WORKDIR /user-service/blockchain-service
RUN npm ci && npm run build
# Back to user-service root
WORKDIR /user-service
RUN npm run build

FROM node:20-bookworm AS runner

WORKDIR /user-service
ENV NODE_ENV=production

COPY --from=deps /user-service/package.json ./
COPY --from=deps /user-service/package-lock.json ./
COPY --from=deps /user-service/node_modules ./node_modules
COPY --from=build /user-service/dist ./dist
COPY --from=build /user-service/src ./src
COPY --from=build /user-service/src/mikro-orm.config.ts ./mikro-orm.config.ts
# Copy blockchain-service compiled files AND node_modules (for ethers, dotenv)
COPY --from=build /user-service/blockchain-service/dist ./blockchain-service/dist
COPY --from=build /user-service/blockchain-service/src/contracts ./blockchain-service/src/contracts
COPY --from=build /user-service/blockchain-service/node_modules ./blockchain-service/node_modules
COPY --from=build /user-service/tsconfig.json ./tsconfig.json

RUN apt-get update \
       && apt-get install -y --no-install-recommends sqlite3 \
       && rm -rf /var/lib/apt/lists/*

COPY --from=build /user-service/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]

