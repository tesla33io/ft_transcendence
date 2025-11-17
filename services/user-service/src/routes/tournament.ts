import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchHistory } from '../entities/MatchHistory';
import { User } from '../entities/User';
import { ethers } from 'ethers';
import { IBlockchainService, BlockchainError } from '../interfaces/blockchain';
import { FromSchema } from 'json-schema-to-ts';
import { mockBlockchainService } from '../services/mockBlockchainService';

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

  const getTxHashParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
  } as const;

  type GetTxHashParams = FromSchema<typeof getTxHashParamsSchema>;

  const getTxHashSuccessSchema = {
    type: 'object',
    properties: {
      tournamentId: { type: 'integer' },
      blockchainTxHash: { type: 'string' },
      status: { type: 'string', enum: ['pending', 'confirmed'] },
      createdAt: { type: 'number' },
      confirmedAt: { type: ['number', 'null'] },
      message: { type: 'string' },
    },
    required: ['tournamentId', 'blockchainTxHash', 'status', 'message'],
  } as const;

  const getTxHashNotFoundSchema = {
    type: 'object',
    properties: {
      error: { type: 'string' },
      tournamentId: { type: 'integer' },
      message: { type: 'string' },
    },
    required: ['error', 'tournamentId', 'message'],
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
            
            app.log.info(`Blockchain transaction hash received: ${txHash} for tournament ${id}`);
            
            // 6. Update database with blockchain transaction hash
            const finalMatch = matches.find(m => m.tournamentWon === true);
            
            if (!finalMatch) {
                app.log.warn(`Final match not found for tournament ${id}. Matches found: ${matches.length}`);
                app.log.warn(`Matches: ${JSON.stringify(matches.map(m => ({ id: m.id, tournamentId: m.tournamentId, tournamentWon: m.tournamentWon })))}`);
                return reply.code(500).send({ 
                    error: 'Final match not found',
                    details: 'Could not find the winning match to update with blockchain hash'
                });
            }
            
            app.log.info(`Found final match: id=${finalMatch.id}, tournamentId=${finalMatch.tournamentId}, tournamentWon=${finalMatch.tournamentWon}`);
            
            // Refresh the entity to ensure it's managed
            await app.em.refresh(finalMatch);
            
            finalMatch.blockchainTxHash = txHash;
            await app.em.persistAndFlush(finalMatch);
            
            app.log.info(`Successfully saved blockchainTxHash ${txHash} to match ${finalMatch.id}`);
            
            // Verify it was saved
            await app.em.refresh(finalMatch);
            if (finalMatch.blockchainTxHash !== txHash) {
                app.log.error(`Failed to save blockchainTxHash! Expected: ${txHash}, Got: ${finalMatch.blockchainTxHash}`);
            } else {
                app.log.info(`Verified blockchainTxHash saved correctly: ${finalMatch.blockchainTxHash}`);
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
    app.get<{ Params: VerifyParams }>('/:id/verify', {
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
            const { id } = request.params as VerifyParams;
            const tournamentId = Number(id);

            if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
              return reply.code(400).send({ error: 'Invalid tournament id' });
            }
      
            const dbMatches = await app.em.find(MatchHistory, { tournamentId });
            
            if (dbMatches.length === 0) {
                return reply.code(404).send({ 
                    verified: false,
                    message: 'Tournament not found locally',
                    blockchain: null,
                    database: {
                        matchCount: 0,
                        tournamentId
                    }
                });
            }

            if (!blockchainService) {
              return reply.code(503).send({
                error: 'Blockchain service not available',
                details: 'Service is not properly configured',
              });
            }
            
            // Check blockchain verification
            const isVerified = await blockchainService.verifyTournament(tournamentId);
            
            if (!isVerified) {
                return reply.code(404).send({
                    verified: false,
                    message: 'Tournament not found on blockchain',
                    blockchain: null,
                    database: {
                        matchCount: dbMatches.length,
                        tournamentId
                    }
                });
            }
            
            // Get tournament details from blockchain
            const blockchainData = await blockchainService.getTournament(tournamentId);

            return reply.send({
              verified: true,
              blockchain: blockchainData,
              database: {
                  matchCount: dbMatches.length,
                  tournamentId,
              },
              message: 'Tournament verified on blockchain',
          });
        } catch (error) {
            app.log.error('Error verifying tournament: ' + String(error));
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // GET /tournaments/:id/blockchain-tx-hash - Get blockchain transaction hash for tournament
    app.get<{ Params: GetTxHashParams }>('/:id/blockchain-tx-hash', {
      schema: {
        tags: ['tournaments'],
        summary: 'Get blockchain transaction hash and status for a finalized tournament',
        description: 'Retrieves the blockchain transaction hash and its status (pending/confirmed) that was saved after tournament results were recorded on the blockchain',
        params: getTxHashParamsSchema,
        response: {
          200: getTxHashSuccessSchema,
          404: getTxHashNotFoundSchema,
          400: finalizeErrorSchema,
          500: finalizeErrorSchema,
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as GetTxHashParams;
        const tournamentId = Number(id);

        if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
          return reply.code(400).send({ 
            error: 'Invalid tournament id',
            details: 'Tournament ID must be a positive integer'
          });
        }

        // Find the final match (where tournamentWon === true) for this tournament
        const finalMatch = await app.em.findOne(MatchHistory, {
          tournamentId: tournamentId,
          tournamentWon: true,
        });

        if (!finalMatch) {
          return reply.code(404).send({
            error: 'Tournament not found or not finalized',
            tournamentId: tournamentId,
            message: 'Tournament does not exist or has not been finalized yet'
          });
        }

        // Check if blockchain transaction hash exists
        if (!finalMatch.blockchainTxHash) {
          return reply.code(404).send({
            error: 'Blockchain transaction hash not found',
            tournamentId: tournamentId,
            message: 'Tournament has been finalized but not yet recorded on blockchain'
          });
        }

        // Get transaction status from mock blockchain service
        let status: 'pending' | 'confirmed' = 'pending';
        let createdAt: number | null = null;
        let confirmedAt: number | null = null;

        try {
          const tx = mockBlockchainService.getTransaction(finalMatch.blockchainTxHash);
          if (tx) {
            status = mockBlockchainService.getTransactionStatus(finalMatch.blockchainTxHash);
            createdAt = tx.createdAt;
            const CONFIRMATION_TIME = 3000;
            confirmedAt = status === 'confirmed' ? tx.createdAt + CONFIRMATION_TIME : null;
          }
        } catch (error) {
          // If transaction not found in mock service, still return the hash
          // but with default status (this handles cases where mock service wasn't used)
          app.log.warn(`Transaction ${finalMatch.blockchainTxHash} not found in mock service: ${error}`);
        }

        return reply.send({
          tournamentId: tournamentId,
          blockchainTxHash: finalMatch.blockchainTxHash,
          status: status,
          createdAt: createdAt,
          confirmedAt: confirmedAt,
          message: 'Blockchain transaction hash retrieved successfully'
        });

      } catch (error) {
        app.log.error('Error retrieving blockchain transaction hash: ' + String(error));
        return reply.code(500).send({ 
          error: 'Internal server error',
          details: String(error)
        });
      }
    });
}