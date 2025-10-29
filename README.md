# ft_transcendence - Microservices Architecture

A comprehensive microservices-based gaming platform built with Node.js, TypeScript, and Docker.

## 🏗️ Project Structure

```
ft_transcendence/
├── services/                    # Microservices
│   ├── gateway-service/         # API Gateway
│   ├── user-service/           # User Management (CRUD, Profiles, Stats, Auth)
│   └── game-service/           # Game Logic & Real-time Gaming
├── frontend/                   # Frontend Application
├── shared/                     # Shared Types, DTOs, Events
├── scripts/                    # DevOps, Testing, Migration Scripts
└── docs/                       # API Documentation & Technical Docs
```

<<<<<<< HEAD
For register send:
Usernamen, Password, if2Factor,AvatarUrl,bio(string caped to 128 char)
---> User created succesfuly or error for example username exist already

For Settings:
NewAvatarUrl, newName, newBioText,newPassword(and check vaild/no duplicate names etc.)
--->get some return "updates succesuly"?

FriendRequest:
	FriendsName,Date
----> request send succesuly or error user dosent exist ? 

AcceptFriendRequest:
	myUserID,myUsername,otherUserName


Get:

FriendRequests:
listofRequests,
for each:
	userId,UserName,requestSendDate, 

FriendsComponent:
listOfAllFriends
for each:
	userId, userName, isOnline(or status if we track inGame?), lastOnlineAt,

For Elo component(used in online game setup page):
PlayerName,Id,Current Rating,Highest Rating,eloGain/los since last game.

1v1 Basic Statics:
UserId, Usernamen, gamesWon, gamesLost, win/losesPercentage, curentWinStreak?, longestWinStreak?, 

playervsAi:
userId,UserName, gamesWon, gamesLost,win/losesPercentage, curentWinStreak?, longestWinStreak?

For Tournamnet statistic component:
TournamentWins,Tounraments Participated,win/losesPercentage


Match history Component:(we dont need match history for tournaments, only 1v1 games)
List of all matches
For each Match:
	match id, OpponentId, opponentName, isWin, userScore, opponentScore, date, opponentElo(at that time), Elogained/lost(at this game).

For profilePage:
userId, userName, AvatarUrl, BioText, isOnline, lastOnline, accountCreationDate,
=======
## Overview
The 42 Transcendence Project is a real-time, multiplayer online Pong game with
user authentication, matchmaking and different game-modes.
Built to showcase advanced full-stack development, it integrates WebSockets,
a retro-looking front-end, and a scalable Node.js backend with SQLite3 and TypeScript.

<<<<<<< HEAD

## License
MIT
=======
>>>>>>> user_management_merge
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

### 🌐 Frontend (Port 5173)
- React/Vue frontend application
- User interface for gaming platform
- Real-time game visualization

### 🌐 Gateway Service (Port 3000)
- API Gateway and routing
- Rate limiting and security
- Request/response transformation
- Load balancing

### 👤 User Service (Port 3002)
- User CRUD operations
- Profile management
- User statistics
- Match history
- Account management
- Authentication (JWT)
- Password management
- Two-factor authentication

### 🎮 Game Service (Ports 5001, 5002)
- Real-time game logic
- WebSocket connections
- Game state management
- Score tracking
- Pong game engine

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

- **Frontend**: http://localhost:5173
- **Gateway**: http://localhost:3000/docs
- **User Service**: http://localhost:3002/docs
- **Game Service**: http://localhost:5001/docs (WebSocket: ws://localhost:5001)

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

