// Service initialization and dependency injection
// This file shows how to properly inject dependencies into the user-service

import { mockBlockchainService } from './mockBlockchainService';
import { setBlockchainService } from '../routes/tournament';

export function initializeServices() {
    // Use mock service for development/testing
    if (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_BLOCKCHAIN === 'true') {
        setBlockchainService(mockBlockchainService);
    }
    // In production, use real blockchain service
    // else {
    //     import('@blockchain-service/blockchainService').then(module => {
    //         setBlockchainService(module.blockchainService);
    //     });
    // }
}
