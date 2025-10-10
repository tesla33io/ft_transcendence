# Docker Setup for ft_transcendence Backend

This document explains how to run the ft_transcendence backend application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Production Mode

```bash
# Build and run with Docker Compose
npm run docker:compose:up

# Or manually
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### Development Mode

```bash
# Run development container with hot reload
npm run docker:compose:dev

# Or manually
docker-compose --profile dev up -d backend-dev
```

The development server will be available at `http://localhost:3001`

## Available Commands

### Docker Commands

```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Run production container
npm run docker:run

# Run development container
npm run docker:run:dev

# Start with Docker Compose (production)
npm run docker:compose:up

# Start development with Docker Compose
npm run docker:compose:dev

# Stop containers
npm run docker:compose:down

# View logs
npm run docker:logs

# View development logs
npm run docker:logs:dev
```

### Manual Docker Commands

```bash
# Build the image
docker build -t ft_transcendence-backend .

# Run the container
docker run -p 3000:3000 ft_transcendence-backend

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  ft_transcendence-backend

# Run with volume mounts
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ft_transcendence-backend
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-in-production` | JWT signing secret |

## Volumes

- `/app/data` - Database files (SQLite)
- `/app/logs` - Application logs

## Health Checks

The container includes health checks that verify the application is responding correctly:

- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 attempts
- **Start Period**: 5 seconds (production) / 40 seconds (development)

## Development vs Production

### Production (`Dockerfile`)
- Multi-stage build for smaller image size
- Only production dependencies
- Compiled TypeScript
- Optimized for performance
- Security hardened (non-root user)

### Development (`Dockerfile.dev`)
- Includes development dependencies
- Hot reload enabled
- Source code mounted as volume
- TypeScript compilation on-the-fly

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill $(lsof -t -i:3000)
```

### Container Won't Start
```bash
# Check container logs
docker logs <container_id>

# Check Docker Compose logs
docker-compose logs backend
```

### Database Issues
```bash
# Remove old database and restart
rm -f data/database.sqlite
docker-compose restart backend
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER data/ logs/
```

## Security Notes

- The production container runs as a non-root user (`nodejs`)
- Environment variables should be set securely in production
- Use Docker secrets for sensitive data in production
- Regularly update base images for security patches

## Production Deployment

For production deployment, consider:

1. Using Docker Swarm or Kubernetes
2. Setting up proper logging aggregation
3. Implementing monitoring and alerting
4. Using external databases (PostgreSQL/MySQL)
5. Setting up SSL/TLS termination
6. Implementing proper backup strategies
