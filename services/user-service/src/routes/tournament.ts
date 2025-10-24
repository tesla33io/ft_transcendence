import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchHistory } from '../entities/MatchHistory';
import { User } from '../entities/User';
import { ethers } from 'ethers';
import { IBlockchainService, BlockchainError } from '../interfaces/blockchain';
import { FromSchema } from 'json-schema-to-ts';

//Schema
const finalizeParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
  } as const;
  type FinalizeParams = FromSchema<typeof finalizeParamsSchema>;
  
  const finalizeBodySchema = {
    type: 'object',
    required: ['winnerId', 'finalScore', 'participantIds'],
    properties: {
      winnerId: { type: 'integer', minimum: 1 },
      finalScore: { type: 'integer', minimum: 0 },
      participantIds: {
        type: 'array',
        minItems: 1,
        items: { type: 'integer', minimum: 1 },
      },
    },
    additionalProperties: false,
  } as const;
  type FinalizeBody = FromSchema<typeof finalizeBodySchema>;
  
  const finalizeSuccessSchema = {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      tournamentId: { type: 'integer' },
      winner: { type: 'string' },
      finalScore: { type: 'integer' },
      blockchainTxHash: { type: 'string' },
      message: { type: 'string' },
    },
    required: [
      'success',
      'tournamentId',
      'winner',
      'finalScore',
      'blockchainTxHash',
      'message',
    ],
  } as const;
  
  const finalizeErrorSchema = {
    type: 'object',
    properties: {
      error: { type: 'string' },
      details: { type: ['string', 'array', 'object', 'null'] },
    },
    required: ['error'],
  } as const;
  
  const verifyParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
  } as const;
  type VerifyParams = FromSchema<typeof verifyParamsSchema>;
  
  const verifyResponseSchema = {
    type: 'object',
    properties: {
      verified: { type: 'boolean' },
      message: { type: 'string' },
      blockchain: { type: 'object', nullable: true },
      database: {
        type: 'object',
        properties: {
          matchCount: { type: 'integer' },
          tournamentId: { type: 'integer' },
        },
        required: ['matchCount', 'tournamentId'],
      },
    },
    required: ['verified', 'message'],
  } as const;

// Dependency injection - blockchain service should be injected
// This makes the service more testable and decoupled
let blockchainService: IBlockchainService | null = null;

export function setBlockchainService(service: IBlockchainService) {
    blockchainService = service;
}

export default async function tournamentRoutes(app: FastifyInstance) {
    
    // POST /tournaments/:id/finalize - Finalize tournament and store on blockchain
    app.post<{
        Params: FinalizeParams;
        Body: FinalizeBody;
      }>('/:id/finalize', {
        schema: {
          tags: ['tournaments'],
          summary: 'Finalize tournament and record on blockchain',
          params: finalizeParamsSchema,
          body: finalizeBodySchema,
          response: {
            200: finalizeSuccessSchema,
            404: finalizeErrorSchema,
            500: finalizeErrorSchema,
            503: finalizeErrorSchema,
          },
        },
      }, async (request: FastifyRequest, reply: FastifyReply) => {
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
            if (!blockchainService) {
                return reply.code(503).send({ 
                    error: 'Blockchain service not available',
                    details: 'Service is not properly configured'
                });
            }

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
                finalMatch.blockchainTxHash = txHash;
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
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
    
    // GET /tournaments/:id/verify - Verify tournament on blockchain
    app.get<{ Params: VerifyParams }> ('/:id/verify', {
        schema: {
          tags: ['tournaments'],
          summary: 'Verify tournament state on blockchain',
          params: verifyParamsSchema,
          response: {
            200: verifyResponseSchema,
            500: finalizeErrorSchema,
            503: finalizeErrorSchema,
          },
        },
      }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as any;
            
            if (!blockchainService) {
                return reply.code(503).send({ 
                    error: 'Blockchain service not available',
                    details: 'Service is not properly configured'
                });
            }
            
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