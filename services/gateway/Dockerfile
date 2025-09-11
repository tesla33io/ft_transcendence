FROM node:18

WORKDIR /gateway

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
