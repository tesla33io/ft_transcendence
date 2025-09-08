FROM node:24

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000 8080

CMD ["npm", "run", "dev"]
