FROM node:20-slim

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy everything else
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]

