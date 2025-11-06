import '../types/fastify';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MatchHistory, MatchResult as MatchResultEnum } from '../entities/MatchHistory';
import { User, UserRole } from '../entities/User';

type MatchResultValue = typeof MatchResultEnum[keyof typeof MatchResultEnum];

const authenticateToken = (app: FastifyInstance) => async (request: FastifyRequest, reply: FastifyReply) => {
	const authHeader = request.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return reply.code(401).send({ error: 'Access token required' });
	}

	const userId = Number(token);
	if (!Number.isInteger(userId) || userId <= 0) {
		return reply.code(403).send({ error: 'Invalid token supplied' });
	}

	try {
		const user = await app.em.findOne(User, { id: userId });
		if (!user) {
			return reply.code(403).send({ error: 'User not found' });
		}
		request.user = user;
	} catch (error) {
		request.log.error({ err: error }, 'Error during token authentication');
		return reply.code(403).send({ error: 'Invalid or expired token' });
	}
};

interface MatchHistoryParams {
	userId: string;
	matchId?: string;
}

interface MatchHistoryCreatePayload {
	userId: number;
	opponentId: number;
	tournamentId?: number | null;
	tournamentWon?: boolean | null;
	result: MatchResultValue;
	userScore: number;
	opponentScore: number;
	startTime?: string | null;
	endTime?: string | null;
	playedAt: string;
}

type MatchHistoryUpdatePayload = Partial<Omit<MatchHistoryCreatePayload, 'userId' | 'opponentId'>> & {
	opponentId?: number;
};

interface MatchHistoryResponse {
	id: number;
	user: { id: number; username: string };
	opponent: { id: number; username: string };
	tournamentId: number | null;
	tournamentWon: boolean | null;
	result: MatchResultValue;
	userScore: number;
	opponentScore: number;
	startTime: string | null;
	endTime: string | null;
	playedAt: string;
	isWin: boolean;
	isLoss: boolean;
	isDraw: boolean;
	isForfeit: boolean;
	scoreDifference: number;
	isCloseGame: boolean;
	isBlowout: boolean;
}

const MATCH_RESULT_VALUES = new Set<MatchResultValue>(Object.values(MatchResultEnum));

function formatUserSummary(user: User) {
	return {
		id: user.id,
		username: user.username,
	};
}

function formatMatchHistoryResponse(match: MatchHistory): MatchHistoryResponse {
	const startTime = match.startTime instanceof Date ? match.startTime.toISOString() : null;
	const endTime = match.endTime instanceof Date ? match.endTime.toISOString() : null;

	return {
		id: match.id,
		user: formatUserSummary(match.user),
		opponent: formatUserSummary(match.opponent),
		tournamentId: match.tournamentId ?? null,
		tournamentWon: match.tournamentWon ?? null,
		result: match.result,
		userScore: match.userScore,
		opponentScore: match.opponentScore,
		startTime,
		endTime,
		playedAt: match.playedAt.toISOString(),
		isWin: match.isWin(),
		isLoss: match.isLoss(),
		isDraw: match.isDraw(),
		isForfeit: match.isForfeit(),
		scoreDifference: match.getScoreDifference(),
		isCloseGame: match.isCloseGame(),
		isBlowout: match.isBlowout(),
	};
}

function parseDateField(value: string | null | undefined, field: string, errors: string[], allowNull = true): Date | undefined | null {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		if (!allowNull) {
			errors.push(`Field ${field} cannot be null`);
		}
		return allowNull ? null : undefined;
	}

	if (typeof value !== 'string') {
		errors.push(`Field ${field} must be an ISO 8601 string or null`);
		return undefined;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		errors.push(`Field ${field} must be a valid ISO 8601 string`);
		return undefined;
	}

	return parsed;
}

async function resolveTargetUser(app: FastifyInstance, rawUserId: string, request: FastifyRequest, reply: FastifyReply) {
	const userId = Number(rawUserId);
	if (!Number.isInteger(userId) || userId <= 0) {
		await reply.code(400).send({ error: 'Invalid user id' });
		return undefined;
	}

	const targetUser = await app.em.findOne(User, { id: userId });
	if (!targetUser) {
		await reply.code(404).send({ error: 'User not found' });
		return undefined;
	}

	if (request.user!.id !== targetUser.id && request.user!.role !== UserRole.ADMIN) {
		await reply.code(403).send({ error: 'Forbidden' });
		return undefined;
	}

	return targetUser;
}

async function loadMatch(app: FastifyInstance, user: User, rawMatchId: string, reply: FastifyReply) {
	const matchId = Number(rawMatchId);
	if (!Number.isInteger(matchId) || matchId <= 0) {
		await reply.code(400).send({ error: 'Invalid match id' });
		return undefined;
	}

	const match = await app.em.findOne(MatchHistory, { id: matchId, user }, { populate: ['user', 'opponent'] });
	if (!match) {
		await reply.code(404).send({ error: 'Match not found' });
		return undefined;
	}

	return match;
}

async function resolveOpponent(app: FastifyInstance, opponentId: number, errors: string[]) {
	if (!Number.isInteger(opponentId) || opponentId <= 0) {
		errors.push('Field opponentId must be a positive integer');
		return undefined;
	}

	const opponent = await app.em.findOne(User, { id: opponentId });
	if (!opponent) {
		errors.push('Opponent user not found');
		return undefined;
	}

	return opponent;
}

function validateScores(score: unknown, field: string, errors: string[]) {
	if (score === undefined) {
		errors.push(`Field ${field} is required`);
		return undefined;
	}

	if (typeof score !== 'number' || Number.isNaN(score)) {
		errors.push(`Field ${field} must be a finite number`);
		return undefined;
	}

	if (!Number.isInteger(score) || score < 0) {
		errors.push(`Field ${field} must be a non-negative integer`);
		return undefined;
	}

	return score;
}

function validateOptionalScore(score: unknown, field: string, errors: string[]) {
	if (score === undefined) {
		return undefined;
	}

	if (typeof score !== 'number' || Number.isNaN(score)) {
		errors.push(`Field ${field} must be a finite number`);
		return undefined;
	}

	if (!Number.isInteger(score) || score < 0) {
		errors.push(`Field ${field} must be a non-negative integer`);
		return undefined;
	}

	return score;
}

export default async function matchHistoryRoutes(app: FastifyInstance) {
	app.get<{ Params: MatchHistoryParams }>('/:userId', { preHandler: authenticateToken(app) }, async (request, reply) => {
		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) {
			return;
		}

		const matches = await app.em.find(
			MatchHistory,
			{ user: targetUser },
			{ orderBy: { playedAt: 'DESC' }, populate: ['user', 'opponent'] }
		);

		return reply.send(matches.map(formatMatchHistoryResponse));
	});

	app.get<{ Params: Required<MatchHistoryParams> }>('/:userId/:matchId', { preHandler: authenticateToken(app) }, async (request, reply) => {
		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) {
			return;
		}

		const match = await loadMatch(app, targetUser, request.params.matchId, reply);
		if (!match) {
			return;
		}

		return reply.send(formatMatchHistoryResponse(match));
	});

	app.post<{ Body: MatchHistoryCreatePayload }>('/', { preHandler: authenticateToken(app) }, async (request, reply) => {
		const { body } = request;
		if (!body || typeof body !== 'object') {
			return reply.code(400).send({ error: 'Request body must be an object' });
		}

		const errors: string[] = [];

		if (!Number.isInteger(body.userId) || body.userId <= 0) {
			errors.push('Field userId must be a positive integer');
		}

		if (body.opponentId === undefined) {
			errors.push('Field opponentId is required');
		}

		if (body.userId === body.opponentId) {
			errors.push('Field opponentId must reference a different user than userId');
		}

		if (!MATCH_RESULT_VALUES.has(body.result)) {
			errors.push(`Field result must be one of: ${Array.from(MATCH_RESULT_VALUES).join(', ')}`);
		}

			if (body.playedAt === undefined || body.playedAt === null) {
				errors.push('Field playedAt is required');
			}

			const playedAt = parseDateField(body.playedAt, 'playedAt', errors, false);

		const startTime = parseDateField(body.startTime, 'startTime', errors);
		const endTime = parseDateField(body.endTime, 'endTime', errors);

		const userScore = validateScores(body.userScore, 'userScore', errors);
		const opponentScore = validateScores(body.opponentScore, 'opponentScore', errors);

		if (errors.length > 0) {
			return reply.code(400).send({ error: 'Validation failed', details: errors });
		}

		const user = await app.em.findOne(User, { id: body.userId });
		if (!user) {
			return reply.code(404).send({ error: 'User not found' });
		}

		if (request.user!.id !== user.id && request.user!.role !== UserRole.ADMIN) {
			return reply.code(403).send({ error: 'Forbidden' });
		}

		const opponent = await resolveOpponent(app, body.opponentId, errors);
		if (!opponent) {
			return reply.code(400).send({ error: 'Validation failed', details: errors });
		}

		const match = new MatchHistory();
		match.user = user;
		match.opponent = opponent;
		match.tournamentId = body.tournamentId ?? undefined;
		match.tournamentWon = body.tournamentWon ?? undefined;
		match.result = body.result;
		match.userScore = userScore!;
		match.opponentScore = opponentScore!;
		match.startTime = startTime === null ? undefined : startTime;
		match.endTime = endTime === null ? undefined : endTime;
		match.playedAt = playedAt!;

		await app.em.persist(match);
		await app.em.flush();
		await app.em.populate(match, ['user', 'opponent']);

		return reply.code(201).send(formatMatchHistoryResponse(match));
	});

	app.patch<{ Params: Required<MatchHistoryParams>; Body: MatchHistoryUpdatePayload }>(
		'/:userId/:matchId',
		{ preHandler: authenticateToken(app) },
		async (request, reply) => {
			if (!request.body || typeof request.body !== 'object') {
				return reply.code(400).send({ error: 'Request body must be an object' });
			}

			const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
			if (!targetUser) {
				return;
			}

			const match = await loadMatch(app, targetUser, request.params.matchId, reply);
			if (!match) {
				return;
			}

			const errors: string[] = [];

			if (request.body.result !== undefined && !MATCH_RESULT_VALUES.has(request.body.result)) {
				errors.push(`Field result must be one of: ${Array.from(MATCH_RESULT_VALUES).join(', ')}`);
			}

			let opponent = match.opponent;
			if (request.body.opponentId !== undefined) {
				const resolvedOpponent = await resolveOpponent(app, request.body.opponentId, errors);
				if (resolvedOpponent) {
					if (resolvedOpponent.id === targetUser.id) {
						errors.push('Field opponentId must reference a different user than userId');
					} else {
						opponent = resolvedOpponent;
					}
				}
			}

			const startTime = parseDateField(request.body.startTime ?? undefined, 'startTime', errors);
			const endTime = parseDateField(request.body.endTime ?? undefined, 'endTime', errors);
			const playedAt = parseDateField(request.body.playedAt ?? undefined, 'playedAt', errors, false);

			const userScore = validateOptionalScore(request.body.userScore, 'userScore', errors);
			const opponentScore = validateOptionalScore(request.body.opponentScore, 'opponentScore', errors);

			if (errors.length > 0) {
				return reply.code(400).send({ error: 'Validation failed', details: errors });
			}

			match.opponent = opponent;

			if (request.body.tournamentId !== undefined) {
				match.tournamentId = request.body.tournamentId ?? undefined;
			}

			if (request.body.tournamentWon !== undefined) {
				match.tournamentWon = request.body.tournamentWon ?? undefined;
			}

			if (request.body.result !== undefined) {
				match.result = request.body.result;
			}

			if (userScore !== undefined) {
				match.userScore = userScore;
			}

			if (opponentScore !== undefined) {
				match.opponentScore = opponentScore;
			}

			if (startTime !== undefined) {
				match.startTime = startTime === null ? undefined : startTime;
			}

			if (endTime !== undefined) {
				match.endTime = endTime === null ? undefined : endTime;
			}

			if (playedAt !== undefined) {
				match.playedAt = playedAt!;
			}

			await app.em.flush();
			await app.em.populate(match, ['user', 'opponent']);

			return reply.send(formatMatchHistoryResponse(match));
		}
	);

	app.delete<{ Params: Required<MatchHistoryParams> }>('/:userId/:matchId', { preHandler: authenticateToken(app) }, async (request, reply) => {
		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) {
			return;
		}

		const match = await loadMatch(app, targetUser, request.params.matchId, reply);
		if (!match) {
			return;
		}

		await app.em.removeAndFlush(match);
		return reply.code(204).send();
	});
}
