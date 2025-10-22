// Shared interfaces for blockchain service communication
// This allows services to depend on interfaces rather than concrete implementations

export interface TournamentData {
    tournamentId: number;
    winnerAddress: string;
    winnerUsername: string;
    finalScore: number;
    participantUsernames: string[];
}

export interface BlockchainTournament {
    tournamentId: number;
    winnerAddress: string;
    winnerUsername: string;
    finalScore: number;
    participantUsernames: string[];
    txHash: string;
    blockNumber: number;
    timestamp: number;
}

export interface IBlockchainService {
    recordTournament(
        tournamentId: number,
        winnerAddress: string,
        winnerUsername: string,
        finalScore: number,
        participantUsernames: string[]
    ): Promise<string>;

    verifyTournament(tournamentId: number): Promise<boolean>;

    getTournament(tournamentId: number): Promise<BlockchainTournament | null>;
}

// Error types for blockchain operations
export class BlockchainError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class BlockchainConnectionError extends BlockchainError {
    constructor(message: string) {
        super(message, 'CONNECTION_ERROR');
    }
}

export class BlockchainTransactionError extends BlockchainError {
    constructor(message: string) {
        super(message, 'TRANSACTION_ERROR');
    }
}
