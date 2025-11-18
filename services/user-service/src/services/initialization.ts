// // Service initialization and dependency injection
// // This file shows how to properly inject dependencies into the user-service

// import { IBlockchainService } from '../interfaces/blockchain';
// import { setBlockchainService } from '../routes/tournament';

// // Mock implementation for development/testing
// class MockBlockchainService implements IBlockchainService {
//     async recordTournament(
//         tournamentId: number,
//         winnerAddress: string,
//         winnerUsername: string,
//         finalScore: number,
//         participantUsernames: string[]
//     ): Promise<string> {
//         // Mock implementation - returns a fake transaction hash
//         return `0x${tournamentId.toString(16).padStart(64, '0')}`;
//     }

//     async verifyTournament(tournamentId: number): Promise<boolean> {
//         // Mock implementation - always returns true for testing
//         return true;
//     }

//     async getTournament(tournamentId: number) {
//         // Mock implementation - returns fake tournament data
//         return {
//             tournamentId,
//             winnerAddress: '0x' + tournamentId.toString(16).padStart(40, '0'),
//             winnerUsername: `winner_${tournamentId}`,
//             finalScore: 100,
//             participants: [`player1_${tournamentId}`, `player2_${tournamentId}`],
//             txHash: `0x${tournamentId.toString(16).padStart(64, '0')}`,
//             blockNumber: 1000000 + tournamentId,
//             timestamp: Date.now()
//         };
//     }
// }

// Real implementation would import the actual blockchain service
// import { blockchainService } from '@blockchain-service/blockchainService';

// export function initializeServices() {
//     // In development, use mock service
//     if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
//         setBlockchainService(new MockBlockchainService());
//     } else {
//         // In production, inject the real blockchain service
//         // setBlockchainService(blockchainService);
        
//         // For now, use mock service until real service is available
//         setBlockchainService(new MockBlockchainService());
//     }
// }

// // Export the mock service for testing
// export { MockBlockchainService };


// Service initialization and dependency injection
// This file shows how to properly inject dependencies into the user-service

import { mockBlockchainService } from './mockBlockchainService';
import { realBlockchainService } from './realBlockchainService';
import { setBlockchainService } from '../routes/tournament';

export function initializeServices() {
    // Use real blockchain service if USE_MOCK_BLOCKCHAIN is not set to 'true'
    if (process.env.USE_MOCK_BLOCKCHAIN === 'true') {
        console.log('🔧 Using MOCK blockchain service');
        setBlockchainService(mockBlockchainService);
    } else {
        console.log('⛓️  Using REAL blockchain service');
        setBlockchainService(realBlockchainService);
    }
}
