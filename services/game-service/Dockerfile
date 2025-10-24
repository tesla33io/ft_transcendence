FROM node:20-bullseye

WORKDIR /game-service

COPY package.json package-lock.json* ./

RUN npm install

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

RUN npm run build

EXPOSE 5000 5001 5005 5006

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
