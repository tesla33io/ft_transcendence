// Blockchain service interfaces for user-service
// This makes the service completely portable without external dependencies

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
    participants: string[];
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
