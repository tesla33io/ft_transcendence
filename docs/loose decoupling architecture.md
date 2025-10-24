# User Service Architecture

## Overview
The user-service has been refactored to be more portable and maintainable by removing tight coupling to the repository structure.

## Key Changes

### 1. TypeScript Configuration
- **Before**: `rootDir: "../../"` - tightly coupled to repository structure
- **After**: `rootDir: "src"` with path mapping for cross-service dependencies

```json
{
  "compilerOptions": {
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../../shared/*"],
      "@blockchain-service/*": ["../blockchain-service/src/*"]
    }
  }
}
```

### 2. Dependency Injection
- **Before**: Direct imports from other services (`../../../blockchain-service/src/blockchainService`)
- **After**: Interface-based dependency injection with proper abstraction

```typescript
// Shared interface
import { IBlockchainService } from '@shared/interfaces/blockchain';

// Dependency injection
let blockchainService: IBlockchainService | null = null;
export function setBlockchainService(service: IBlockchainService) {
    blockchainService = service;
}
```

### 3. Service Initialization
Services are now initialized through dependency injection in `src/services/initialization.ts`:

```typescript
export function initializeServices() {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        setBlockchainService(new MockBlockchainService());
    } else {
        // In production, inject the real blockchain service
        setBlockchainService(realBlockchainService);
    }
}
```

## Benefits

1. **Portability**: Service can be moved to different repositories without breaking
2. **Testability**: Easy to mock dependencies for unit testing
3. **Maintainability**: Clear separation of concerns and interfaces
4. **Flexibility**: Can swap implementations without changing business logic
5. **Type Safety**: Shared interfaces ensure consistent contracts

## Usage

### Development
The service automatically uses mock implementations in development mode.

### Production
Inject real services by updating `src/services/initialization.ts`:

```typescript
import { realBlockchainService } from '@blockchain-service/blockchainService';
setBlockchainService(realBlockchainService);
```

### Testing
Use the provided mock services or create custom mocks:

```typescript
import { MockBlockchainService } from './services/initialization';
setBlockchainService(new MockBlockchainService());
```

## Migration Guide

If you have existing code that directly imports other services:

1. **Replace direct imports** with interface imports:
   ```typescript
   // Before
   import { blockchainService } from '../../../blockchain-service/src/blockchainService';
   
   // After
   import { IBlockchainService } from '@shared/interfaces/blockchain';
   ```

2. **Use dependency injection** instead of direct service calls:
   ```typescript
   // Before
   const result = await blockchainService.recordTournament(...);
   
   // After
   if (!blockchainService) throw new Error('Service not initialized');
   const result = await blockchainService.recordTournament(...);
   ```

3. **Initialize services** in your application startup:
   ```typescript
   import { initializeServices } from './services/initialization';
   initializeServices();
   ```
