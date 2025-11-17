// Mock blockchain service with transaction status tracking
import { IBlockchainService } from '../interfaces/blockchain';
import { randomBytes } from 'crypto';

interface TransactionStatus {
    hash: string;
    createdAt: number;
    tournamentId: number;
    status: 'pending' | 'confirmed';
}

class MockBlockchainService implements IBlockchainService {
    // In-memory store for transaction statuses
    private transactions: Map<string, TransactionStatus> = new Map();
    
    // Cleanup old transactions (older than 1 hour)
    private cleanupOldTransactions() {
        const oneHourAgo = Date.now() - 3600000;
        for (const [hash, tx] of this.transactions.entries()) {
            if (tx.createdAt < oneHourAgo) {
                this.transactions.delete(hash);
            }
        }
    }

    // Generate a realistic transaction hash
    private generateTxHash(tournamentId: number): string {
        const random = randomBytes(32);
        return '0x' + random.toString('hex');
    }

    async recordTournament(
        tournamentId: number,
        winnerAddress: string,
        winnerUsername: string,
        finalScore: number,
        participantUsernames: string[]
    ): Promise<string> {
        // Generate transaction hash
        const txHash = this.generateTxHash(tournamentId);
        
        // Store transaction with pending status
        this.transactions.set(txHash, {
            hash: txHash,
            createdAt: Date.now(),
            tournamentId,
            status: 'pending'
        });

        // Cleanup old transactions
        this.cleanupOldTransactions();

        return txHash;
    }

    async verifyTournament(tournamentId: number): Promise<boolean> {
        // Find transaction for this tournament
        for (const tx of this.transactions.values()) {
            if (tx.tournamentId === tournamentId) {
                return this.getTransactionStatus(tx.hash) === 'confirmed';
            }
        }
        return false;
    }

    async getTournament(tournamentId: number) {
        // Find transaction for this tournament
        for (const tx of this.transactions.values()) {
            if (tx.tournamentId === tournamentId) {
                return {
                    tournamentId,
                    winnerAddress: '0x' + tournamentId.toString(16).padStart(40, '0'),
                    winnerUsername: `winner_${tournamentId}`,
                    finalScore: 100,
                    participants: [`player1_${tournamentId}`, `player2_${tournamentId}`],
                    txHash: tx.hash,
                    blockNumber: 1000000 + tournamentId,  // Add this line
                    timestamp: tx.createdAt
                };
            }
        }
        return null;
    }

    // Get transaction status (pending → confirmed after 3 seconds)
    getTransactionStatus(txHash: string): 'pending' | 'confirmed' {
        const tx = this.transactions.get(txHash);
        if (!tx) {
            throw new Error('Transaction not found');
        }

        const elapsed = Date.now() - tx.createdAt;
        const CONFIRMATION_TIME = 3000; // 3 seconds

        if (elapsed >= CONFIRMATION_TIME) {
            // Update status to confirmed
            tx.status = 'confirmed';
            return 'confirmed';
        }

        return 'pending';
    }

    // Get transaction details
    getTransaction(txHash: string): TransactionStatus | null {
        return this.transactions.get(txHash) || null;
    }
}

// Export singleton instance
export const mockBlockchainService = new MockBlockchainService();
