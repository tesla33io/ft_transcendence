# ft_transcendence - Microservices Architecture

A comprehensive microservices-based gaming platform built with Node.js, TypeScript, and Docker.

## 🏗️ Project Structure

```
ft_transcendence/
├── services/                    # Microservices
│   ├── gateway/                # API Gateway / Frontend Backend
│   ├── auth-service/           # Authentication & Authorization
│   ├── user-service/          # User Management (CRUD, Profiles, Stats)
│   ├── game-service/          # Game Logic & Real-time Gaming
│   └── tournament-service/     # Tournament Management
├── frontend/                   # Frontend Application
├── shared/                     # Shared Types, DTOs, Events
├── scripts/                    # DevOps, Testing, Migration Scripts
└── docs/                       # API Documentation & Technical Docs
```

{
	gameMode: 'tournament',
	status: 'ready',
	id: tournament.id,
	player1: tournament.players[0],
	player2: tournament.players[1],
	player3: tournament.players[2],
	player4: tournament.players[3]
	finalist1: string //name of player or null 
	finalist2: string //name of player or null
	champion: string //name of player or null
}

//websocket messaging struckt 
{
	"event": string ,//for example "error" or "gameUpadate" etc
	"type": string ,//for example on game update "paddleMove" or "scoreUpdate" etc
	"data": any //json object with all needed data for the event and type 
}

## 🚀 Quick Start

### Development Mode
```bash
# Start all services in development mode
./scripts/start-dev.sh

# Or start individual services
cd services/user-service && npm run dev
```

### Production Mode
```bash
# Build all services
./scripts/build-all.sh

# Start with Docker Compose
docker-compose up -d
```

## 📋 Services Overview

### 🌐 Gateway Service (Port 3000)
- API Gateway and routing
- Rate limiting and security
- Request/response transformation
- Load balancing

### 🔐 Auth Service (Port 3001)
- User authentication (JWT)
- Password management
- Two-factor authentication
- Session management

### 👤 User Service (Port 3002)
- User CRUD operations
- Profile management
- User statistics
- Match history
- Account management

### 🎮 Game Service (Port 3003)
- Real-time game logic
- WebSocket connections
- Game state management
- Score tracking

### 🏆 Tournament Service (Port 3004)
- Tournament creation and management
- Bracket generation
- Tournament scheduling
- Results tracking

## 🛠️ Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd ft_transcendence

# Install dependencies for all services
find services -name "package.json" -execdir npm install \;

# Start development environment
./scripts/start-dev.sh
```

### Service Development
Each service is independent and can be developed separately:

```bash
# Work on user service
cd services/user-service
npm run dev

# Work on game service
cd services/game-service
npm run dev
```

## 🐳 Docker

### Build Individual Service
```bash
cd services/user-service
docker build -t ft_transcendence-user-service .
```

### Run All Services
```bash
docker-compose up -d
```

### Development with Hot Reload
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 📚 API Documentation

- **Gateway**: http://localhost:3000/docs
- **Auth Service**: http://localhost:3001/docs
- **User Service**: http://localhost:3002/docs
- **Game Service**: http://localhost:3003/docs
- **Tournament Service**: http://localhost:3004/docs

## 🧪 Testing

```bash
# Run tests for all services
find services -name "package.json" -execdir npm test \;

# Run tests for specific service
cd services/user-service
npm test
```

## 📦 Shared Resources

The `shared/` directory contains:
- **types.ts**: Common TypeScript interfaces
- **dtos.ts**: Data Transfer Objects
- **events.ts**: Event definitions for inter-service communication
- **utils.ts**: Shared utility functions

## 🔧 Configuration

Each service has its own configuration:
- Environment variables
- Docker configuration
- Database connections
- Service discovery

## 📈 Monitoring & Logging

- Centralized logging
- Health checks for all services
- Performance monitoring
- Error tracking

