#<<<<<<< HEAD
#FROM node:20-bullseye
#
#WORKDIR /user-service
#
#COPY package.json package-lock.json* ./
#
#RUN npm install
#
#COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
#RUN chmod +x /usr/local/bin/docker-entrypoint.sh
#
#COPY . .
#
#RUN npm run build
#
#EXPOSE 8000
#
#ENTRYPOINT ["docker-entrypoint.sh"]
#CMD ["npm", "run", "dev"]
#=======
# Multi-stage build for production
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install all dependencies
RUN npm cache clean --force
RUN npm ci --no-audit --no-fund

# Install TypeScript globally to avoid local binary issues
RUN npm install -g typescript

# Verify TypeScript installation
RUN tsc --version

# Copy source code
COPY . .

# Build TypeScript directly
RUN tsc

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy source files (needed for mikro-orm config)
COPY --from=builder /app/src ./src

# Copy configuration files (both TS and compiled JS)
COPY --from=builder /app/src/mikro-orm.config.ts ./
COPY --from=builder /app/dist/mikro-orm.config.js ./dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "start:prod"]
