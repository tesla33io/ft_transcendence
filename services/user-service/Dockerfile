FROM node:20-bookworm AS deps

WORKDIR /user-service

COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
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
COPY tsconfig.json ./

RUN apt-get update \
       && apt-get install -y --no-install-recommends sqlite3 \
       && rm -rf /var/lib/apt/lists/*

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh


EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]

