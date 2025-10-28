FROM node:20-bookworm

WORKDIR /user-service

COPY package*.json ./
RUN npm i

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

RUN npm run build

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

