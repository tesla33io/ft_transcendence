# Awesome Database Framework

## Usage

### Basic Setup

```typescript
import { GameDatabase } from './src/index.js';

const gameDb = GameDatabase.getInstance();
await gameDb.initialize();
```

### User Management

```typescript
// Create user
const user = await gameDb.userService.createUser('username', 'password');

// Validate login
const validatedUser = await gameDb.userService.validateUser('username', 'password');

// Update profile
await gameDb.userService.updateUserProfile(user.id, { avatar: 'avatar.jpg' });
```

### Friend System

```typescript
// Send friend request
const request = await gameDb.friendService.sendFriendRequest(user1.id, user2.id);

// Accept friend request
await gameDb.friendService.acceptFriendRequest(request.id, user2.id);

// Get friends list
const friends = await gameDb.friendService.getFriends(user.id);
```

### Game Management

```typescript
// Create game
const game = await gameDb.gameService.createGame('chess', user.id);

// Add players
await gameDb.gameService.addPlayerToGame(game.id, user1.id, 1);
await gameDb.gameService.addPlayerToGame(game.id, user2.id, 2);

// Update scores
await gameDb.gameService.updatePlayerScore(game.id, user1.id, 100);

// End game
await gameDb.gameService.endGame(game.id, { winner: user1.id });
```

### Direct Repository Access

```typescript
// Access repositories directly if needed
const userRepo = gameDb.repositories.user;
const users = await userRepo.findAll();
```

## Database Schema

The framework implements the following tables:
- `users` - Core user accounts
- `refresh_tokens` - Session management
- `recovery_tokens` - Password recovery
- `friends` - Friend relationships
- `audit_events` - System logging
- `games` - Game sessions
- `game_players` - Player participation
- `tournaments` - Tournament structure
- `tournament_rounds` - Tournament rounds

## Environment Variables

- `DB_NAME` - Database file name (default: 'game.db')
- `NODE_ENV` - Environment mode (affects debug logging)

## Development

```bash
# Build
npm run build

# Development with hot reload
npm run dev

# Start production
npm start
```

## Architecture

- **Entities**: MikroORM entities with decorators
- **Services**: Business logic layer
- **Database**: Singleton wrapper with repository access
- **Config**: Centralized configuration

The framework uses a singleton pattern for database access and provides both high-level services and direct repository access for flexibility.
