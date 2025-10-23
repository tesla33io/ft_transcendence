import 'dotenv/config';
import { ethers } from 'ethers';
import * as TournamentScoresABI from './contracts/TournamentScores.json';

export class BlockchainService {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;
    
    constructor() {
        // Avalanche Fuji Testnet RPC
        this.provider = new ethers.providers.JsonRpcProvider(
            process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
        );
        
        // Your wallet private key (keep this secret!)
        this.wallet = new ethers.Wallet(
            process.env.BLOCKCHAIN_PRIVATE_KEY!,
            this.provider
        );
        
        // Initialize contract
        this.contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS!,
            TournamentScoresABI.abi,
            this.wallet
        );
    }

    // Record tournament on blockchain
    async recordTournament(
        tournamentId: number,
        winnerAddress: string,
        winnerUsername: string,
        finalScore: number,
        participants: string[]
    ): Promise<string> {
        try {
            const tx = await this.contract.recordTournament(
                tournamentId,
                winnerAddress,
                winnerUsername,
                finalScore,
                participants
            );
            
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log(`Tournament ${tournamentId} recorded on blockchain. TX: ${receipt.transactionHash}`);
            return receipt.transactionHash;
        } catch (error) {
            console.error('Error recording tournament:', error);
            throw error;
        }
    }

    // Verify tournament on blockchain
    async verifyTournament(tournamentId: number): Promise<boolean> {
        try {
            return await this.contract.verifyTournament(tournamentId);
        } catch (error) {
            console.error('Error verifying tournament:', error);
            return false;
        }
    }
    
    // Get tournament details from blockchain
    async getTournament(tournamentId: number) {
        try {
            const result = await this.contract.getTournament(tournamentId);
            return {
                tournamentId: result.tournamentId.toNumber(),
                timestamp: result.timestamp.toNumber(),
                winner: result.winner,
                winnerUsername: result.winnerUsername,
                finalScore: result.finalScore.toNumber(),
                participants: result.participants,
                verified: result.verified
            };
        } catch (error) {
            console.error('Error getting tournament:', error);
            throw error;
        }
    }

    // Get wallet balance (for monitoring gas fees)
    async getBalance(): Promise<string> {
        const balance = await this.wallet.getBalance();
        return ethers.utils.formatEther(balance);
    }
}

export const blockchainService = new BlockchainService();