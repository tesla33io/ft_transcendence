import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchHistory } from '../entities/MatchHistory';
import { User } from '../entities/User';
import { ethers } from 'ethers';
//import { blockchainService } from '../../../blockchain-service/src/blockchainService';
// import { blockchainService } from '../../../blockchain-service/src/blockchainService';
import { blockchainService } from '../../../blockchain-service/src/blockchainService';

export default async function tournamentRoutes(app: FastifyInstance) {
    
    // POST /tournaments/:id/finalize - Finalize tournament and store on blockchain
    app.post('/:id/finalize', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as any;
            const { winnerId, finalScore, participantIds } = request.body as any;
            
            // 1. Get tournament matches from database
            const matches = await app.em.find(MatchHistory, {
                tournamentId: parseInt(id),
            }, { populate: ['user', 'opponent'] });
            
            if (!matches || matches.length === 0) {
                return reply.code(404).send({ error: 'Tournament not found' });
            }
            
            // 2. Find winner
            const winner = await app.em.findOne(User, { id: winnerId });
            if (!winner) {
                return reply.code(404).send({ error: 'Winner not found' });
            }
            
            // 3. Get participant usernames
            const participants = await app.em.find(User, { 
                id: { $in: participantIds } 
            });
            const participantUsernames = participants.map(p => p.username);
            
            // 4. Generate a wallet address for winner (or use existing)
            // For simplicity, we'll use a deterministic address based on user ID
            const winnerAddress = ethers.utils.getAddress(
                ethers.utils.hexZeroPad(ethers.utils.hexlify(winnerId), 20)
            );
            
            // 5. Record on blockchain
            const txHash = await blockchainService.recordTournament(
                parseInt(id),
                winnerAddress,
                winner.username,
                finalScore,
                participantUsernames
            );
            
            // 6. Update database with blockchain transaction hash
            const finalMatch = matches.find(m => m.tournamentWon === true);
            if (finalMatch) {
                finalMatch.blockchainTxHash = txHash; // Add this field to MatchHistory entity
                await app.em.persistAndFlush(finalMatch);
            }
            
            return reply.send({
                success: true,
                tournamentId: id,
                winner: winner.username,
                finalScore: finalScore,
                blockchainTxHash: txHash,
                message: 'Tournament finalized and recorded on blockchain'
            });
            
        } catch (error) {
            app.log.error('Error finalizing tournament:' + String(error));
            app.log.error(error);  // Log the full error object
            console.error('Full error:', error);  // Also console log
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
    
    // GET /tournaments/:id/verify - Verify tournament on blockchain
    app.get('/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as any;
            
            // Check blockchain verification
            const isVerified = await blockchainService.verifyTournament(parseInt(id));
            
            if (!isVerified) {
                return reply.send({
                    verified: false,
                    message: 'Tournament not found on blockchain'
                });
            }
            
            // Get tournament details from blockchain
            const blockchainData = await blockchainService.getTournament(parseInt(id));
            
            // Get database data for comparison
            const dbMatches = await app.em.find(MatchHistory, {
                tournamentId: parseInt(id)
            });
            
            return reply.send({
                verified: true,
                blockchain: blockchainData,
                database: {
                    matchCount: dbMatches.length,
                    tournamentId: parseInt(id)
                },
                message: 'Tournament verified on blockchain'
            });
            
        } catch (error) {
            app.log.error('Error verifying tournament: ' + String(error));
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}