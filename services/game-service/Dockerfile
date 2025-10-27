FROM node:20-bullseye

WORKDIR /game-service

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000 5001 5005 5006

CMD ["npm", "run", "dev"]
