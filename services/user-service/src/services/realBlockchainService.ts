// Real blockchain service adapter - wraps the existing blockchain-service
import { IBlockchainService, BlockchainTournament } from '../interfaces/blockchain';
import * as path from 'path';

class RealBlockchainServiceAdapter implements IBlockchainService {
    private blockchainService: any;
    private initialized: boolean = false;

    private initialize() {
        if (this.initialized) return;
        
        try {
            // Use absolute path from the working directory
            const blockchainDistPath = path.resolve(process.cwd(), 'blockchain-service', 'dist');
            const blockchainNodeModulesPath = path.resolve(process.cwd(), 'blockchain-service', 'node_modules');
            
            console.log(`🔍 Attempting to load blockchain service from: ${blockchainDistPath}`);
            console.log(`📦 Blockchain node_modules at: ${blockchainNodeModulesPath}`);
            
            // Verify files exist before requiring
            const fs = require('fs');
            const blockchainServiceFile = path.join(blockchainDistPath, 'blockchainService.js');
            
            if (!fs.existsSync(blockchainServiceFile)) {
                throw new Error(`Blockchain service file not found at: ${blockchainServiceFile}`);
            }
            
            console.log(`✅ Found blockchain service file: ${blockchainServiceFile}`);
            
            // Add blockchain-service node_modules to module resolution BEFORE requiring
            const Module = require('module');
            const originalResolveFilename = Module._resolveFilename;
            const originalPaths = Module._resolveLookupPaths;
            
            // Override module resolution to include blockchain-service node_modules
            Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
                // For ethers and dotenv, try blockchain-service node_modules first
                if (request === 'ethers' || request === 'dotenv' || request.startsWith('dotenv/')) {
                    try {
                        const paths = [blockchainNodeModulesPath, ...(parent?.paths || [])];
                        return originalResolveFilename.call(this, request, {
                            ...parent,
                            paths: paths
                        }, isMain, options);
                    } catch (e) {
                        // Fall through to normal resolution
                    }
                }
                return originalResolveFilename.call(this, request, parent, isMain, options);
            };
            
            // Now require the blockchain service using absolute path
            delete require.cache[blockchainServiceFile]; // Clear cache if it exists
            const blockchainModule = require(blockchainServiceFile);
            
            // Restore original resolve
            Module._resolveFilename = originalResolveFilename;
            
            // Extract BlockchainService class
            const BlockchainService = blockchainModule.BlockchainService || 
                                      blockchainModule.default?.BlockchainService || 
                                      blockchainModule.default;
            
            if (!BlockchainService) {
                throw new Error('BlockchainService class not found in module. Available exports: ' + Object.keys(blockchainModule).join(', '));
            }
            
            console.log('✅ BlockchainService class found, instantiating...');
            this.blockchainService = new BlockchainService();
            this.initialized = true;
            console.log('✅ Real blockchain service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain service:', error);
            console.error('Current working directory:', process.cwd());
            
            // Debug: Check if files exist
            try {
                const fs = require('fs');
                const distPath = path.resolve(process.cwd(), 'blockchain-service', 'dist');
                const nodeModulesPath = path.resolve(process.cwd(), 'blockchain-service', 'node_modules');
                
                console.error('Checking paths:');
                console.error(`  dist exists: ${fs.existsSync(distPath)}`);
                console.error(`  node_modules exists: ${fs.existsSync(nodeModulesPath)}`);
                
                if (fs.existsSync(distPath)) {
                    console.error(`  dist contents: ${fs.readdirSync(distPath).join(', ')}`);
                }
                if (fs.existsSync(nodeModulesPath)) {
                    console.error(`  node_modules has ethers: ${fs.existsSync(path.join(nodeModulesPath, 'ethers'))}`);
                    console.error(`  node_modules has dotenv: ${fs.existsSync(path.join(nodeModulesPath, 'dotenv'))}`);
                }
            } catch (fsError) {
                console.error('Could not check directory contents:', fsError);
            }
            
            throw new Error(`BlockchainService is not available: ${error}. Make sure blockchain-service is built and accessible.`);
        }
    }

    async recordTournament(
        tournamentId: number,
        winnerAddress: string,
        winnerUsername: string,
        finalScore: number,
        participantUsernames: string[]
    ): Promise<string> {
        this.initialize();
        try {
            const txHash = await this.blockchainService.recordTournament(
                tournamentId,
                winnerAddress,
                winnerUsername,
                finalScore,
                participantUsernames
            );
            return txHash;
        } catch (error) {
            console.error('Real blockchain service error:', error);
            throw error;
        }
    }

    async verifyTournament(tournamentId: number): Promise<boolean> {
        this.initialize();
        try {
            return await this.blockchainService.verifyTournament(tournamentId);
        } catch (error) {
            console.error('Error verifying tournament on blockchain:', error);
            return false;
        }
    }

    async getTournament(tournamentId: number): Promise<BlockchainTournament | null> {
        this.initialize();
        try {
            const result = await this.blockchainService.getTournament(tournamentId);
            if (!result) {
                return null;
            }
            
            return {
                tournamentId: result.tournamentId,
                winnerAddress: result.winner,
                winnerUsername: result.winnerUsername,
                finalScore: result.finalScore,
                participants: result.participants,
                txHash: '',
                blockNumber: 0,
                timestamp: result.timestamp
            };
        } catch (error) {
            console.error('Error getting tournament from blockchain:', error);
            return null;
        }
    }

    // Add this new method for health checks
    async getHealthInfo(): Promise<{
        balance: string;
        walletAddress: string;
    } | null> {
        try {
            this.initialize();
            if (!this.blockchainService) {
                console.error('❌ getHealthInfo: blockchainService is null after initialization');
                return null;
            }
            
            console.log('🔍 getHealthInfo: Attempting to get balance...');
            const balance = await this.blockchainService.getBalance();
            console.log(`✅ getHealthInfo: Balance retrieved: ${balance}`);
            
            const walletAddress = this.blockchainService.wallet?.address || 'Unknown';
            console.log(`✅ getHealthInfo: Wallet address: ${walletAddress}`);
            
            return {
                balance,
                walletAddress
            };
        } catch (error) {
            console.error('❌ Error getting health info:', error);
            if (error instanceof Error) {
                console.error('❌ Error stack:', error.stack);
            }
            return null;
        }
    }
}

// Export singleton instance
export const realBlockchainService = new RealBlockchainServiceAdapter();
