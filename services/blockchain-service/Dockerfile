FROM node:20-bullseye

WORKDIR /blockchain-service

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

# No EXPOSE needed - this is a library, not a server
# No CMD needed - this will be imported by other services