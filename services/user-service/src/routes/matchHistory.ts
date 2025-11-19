import '../types/fastify';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MatchHistory, MatchResult as MatchResultEnum } from '../entities/MatchHistory';
import { User, UserRole, OnlineStatus } from '../entities/User';
import { UserStatistics } from '../entities/UserStatistics';

type MatchResultValue = typeof MatchResultEnum[keyof typeof MatchResultEnum];

const SERVICE_TOKEN = process.env.MATCH_HISTORY_SERVICE_TOKEN ?? '';

const ErrorSchema = {
	type: 'object',
	properties: {
		error: { type: 'string' },
		details: { type: ['string', 'array', 'object', 'null'] },
	},
	required: ['error'],
} as const;

const userSummarySchema = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		username: { type: 'string' },
	},
	required: ['id', 'username'],
} as const;

const matchHistoryResponseSchema = {
	type: 'object',
	properties: {
		matchId: { type: 'integer' },
		user: userSummarySchema,
		opponent: userSummarySchema,
		tournamentId: { type: ['integer', 'null'] },
		tournamentWon: { type: ['boolean', 'null'] },
		result: { type: 'string' },
		userScore: { type: 'integer' },
		opponentScore: { type: 'integer' },
		startTime: { type: ['string', 'null'], format: 'date-time' },
		endTime: { type: ['string', 'null'], format: 'date-time' },
		playedAt: { type: 'string', format: 'date-time' },
		isWin: { type: 'boolean' },
		isLoss: { type: 'boolean' },
		isDraw: { type: 'boolean' },
		isForfeit: { type: 'boolean' },
		scoreDifference: { type: 'integer' },
		isCloseGame: { type: 'boolean' },
		isBlowout: { type: 'boolean' },
	},
	required: [
		'matchId',
		'user',
		'opponent',
		'result',
		'userScore',
		'opponentScore',
		'playedAt',
		'isWin',
		'isLoss',
		'isDraw',
		'isForfeit',
		'scoreDifference',
		'isCloseGame',
		'isBlowout',
	],
} as const;

const MATCH_RESULT_VALUES = new Set<MatchResultValue>(Object.values(MatchResultEnum));

const RESULT_ALIASES = new Map<string, MatchResultValue>([
	['lose', MatchResultEnum.LOSS],
	['lost', MatchResultEnum.LOSS],
	['won', MatchResultEnum.WIN],
	['tie', MatchResultEnum.DRAW],
	['timeout', MatchResultEnum.TIMEOUT],
]);

interface MatchHistoryParams {
	userId: string;
	matchId?: string;
}

interface MatchHistoryCreatePayload {
	userId: number | string;
	opponentId: number | string;
	tournamentId?: number | string | null;
	tournamentWon?: boolean | null;
	result: MatchResultValue | string;
	userScore: number | string;
	opponentScore: number | string;
	startTime?: string | null;
	endTime?: string | null;
	playedAt: string;
}

type MatchHistoryUpdatePayload = Partial<Omit<MatchHistoryCreatePayload, 'userId'>>;

interface MatchHistoryResponse {
	matchId: number;
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

function isServiceRequest(request: FastifyRequest): boolean {
	const token = request.headers['x-service-token'];
	return Boolean(SERVICE_TOKEN) && typeof token === 'string' && token === SERVICE_TOKEN;
}

async function requireSessionUser(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<User | undefined> {
	const sessionUserId = request.session?.userId;
	if (!sessionUserId) {
		await reply.code(401).send({ error: 'Not authenticated' });
		return undefined;
}
	const sessionUser = await app.em.findOne(User, { id: sessionUserId });
	if (!sessionUser) {
		await reply.code(401).send({ error: 'Session user not found' });
		return undefined;
}
	return sessionUser;
}

const attachSessionUser = (app: FastifyInstance) => async (request: FastifyRequest, reply: FastifyReply) => {
	const sessionUser = await requireSessionUser(app, request, reply);
	if (!sessionUser) return;
	request.user = sessionUser;
};

const MATCH_DURATION_THRESHOLD = 0;

function formatUserSummary(user: User) {
	return { id: user.id, username: user.username };
}

function formatMatchHistoryResponse(match: MatchHistory): MatchHistoryResponse {
	const startTime = match.startTime instanceof Date ? match.startTime.toISOString() : null;
	const endTime = match.endTime instanceof Date ? match.endTime.toISOString() : null;

	return {
		matchId: match.id,
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

function coercePositiveInt(value: unknown, field: string, errors: string[]): number | undefined {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
      errors.push(`Field ${field} must be a positive integer`);
      return undefined;
    }
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.push(`Field ${field} must be a positive integer`);
      return undefined;
    }
    return parsed;
  }

function coerceOptionalPositiveInt(value: unknown, field: string, errors: string[]): number | undefined | null {
	if (value === undefined || value === null) return null;
	return coercePositiveInt(value, field, errors);
}

function normalizeResult(value: unknown, errors: string[]): MatchResultValue | undefined {
	if (typeof value !== 'string') {
		errors.push('Field result must be a string');
		return undefined;
}
	const lowered = value.toLowerCase();
	if (RESULT_ALIASES.has(lowered)) return RESULT_ALIASES.get(lowered);
	if (MATCH_RESULT_VALUES.has(lowered as MatchResultValue)) return lowered as MatchResultValue;
	errors.push(`Field result must be one of: ${Array.from(MATCH_RESULT_VALUES).join(', ')}`);
	return undefined;
}

function invertResult(result: MatchResultValue): MatchResultValue {
	switch (result) {
		case MatchResultEnum.WIN:
			return MatchResultEnum.LOSS;
		case MatchResultEnum.LOSS:
			return MatchResultEnum.WIN;
		case MatchResultEnum.DRAW:
			return MatchResultEnum.DRAW;
		case MatchResultEnum.FORFEIT:
		case MatchResultEnum.TIMEOUT:
			return MatchResultEnum.WIN;
		default:
			return MatchResultEnum.LOSS;
	}
}

function parseDateField(
    value: unknown,
    field: string,
    errors: string[],
    required = false,
  ): Date | undefined {
    if (value === undefined) {
      if (required) errors.push(`Field ${field} is required`);
      return undefined;
    }

    if (value === null) {
        errors.push(`Field ${field} cannot be null`);
        return undefined;
    }
  
    if (typeof value !== 'string') {
      errors.push(`Field ${field} must be an ISO 8601 string`);
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      errors.push(`Field ${field} must be a valid ISO 8601 string`);
      return undefined;
    }
  
    return parsed;
}

function validateScore(value: unknown, field: string, errors: string[], required = true): number | undefined {
	if (value === undefined) {
		if (required) errors.push(`Field ${field} is required`);
		return undefined;
    }

    if (value === null) {
        errors.push(`Field ${field} cannot be null`);
        return undefined;
    }

	const parsed = typeof value === 'string' ? Number(value) : value;
	if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
        errors.push(`Field ${field} must be a number`);
        return undefined;
    }

    if (!Number.isInteger(parsed) || parsed < 0) {
        errors.push(`Field ${field} must be a non-negative integer`);
        return undefined;
    }

	return parsed;
}

async function loadOrCreateStats(app: FastifyInstance, user: User): Promise<UserStatistics> {
	let stats = await app.em.findOne(UserStatistics, { user }, { populate: ['user'] });
	if (!stats) {
		stats = new UserStatistics();
		stats.user = user;
		stats.createdAt = new Date();
		stats.updatedAt = new Date();
		await app.em.persist(stats);
	}
	return stats;
}

function applyMatchToStats(
	stats: UserStatistics,
	result: MatchResultValue,
	playedAt: Date,
	durationSeconds?: number,
	tournamentId?: number | null,
	tournamentWon?: boolean | null,
) {
	stats.totalGames += 1;
	stats.lastGameAt = playedAt;
	stats.updatedAt = new Date();

	switch (result) {
		case MatchResultEnum.WIN:
			stats.wins += 1;
			break;
		case MatchResultEnum.DRAW:
			stats.draws += 1;
			break;
		default:
			stats.losses += 1;
			break;
	}

	if (typeof durationSeconds === 'number' && durationSeconds > MATCH_DURATION_THRESHOLD) {
		if (stats.averageGameDuration === 0) {
			stats.averageGameDuration = durationSeconds;
		} else {
			stats.averageGameDuration = Math.round((stats.averageGameDuration + durationSeconds) / 2);
		}
		if (durationSeconds > stats.longestGame) {
			stats.longestGame = durationSeconds;
		}
	}

	if (tournamentId) {
		stats.tournamentsParticipated += 1;
		if (tournamentWon === true) {
			stats.overallTournamentWon += 1;
		}
	}
}

async function resolveTargetUser(app: FastifyInstance, rawUserId: string, request: FastifyRequest, reply: FastifyReply): Promise<User | undefined> {
	const errors: string[] = [];
	const userId = coercePositiveInt(rawUserId, 'userId', errors);
	if (!userId) {
		await reply.code(400).send({ error: 'Validation failed', details: errors });
		return undefined;
}
	const targetUser = await app.em.findOne(User, { id: userId });
	if (!targetUser) {
		await reply.code(404).send({ error: 'User not found' });
		return undefined;
}
	const requester = request.user as User | undefined;
	if (requester && requester.id !== targetUser.id && requester.role !== UserRole.ADMIN) {
		await reply.code(403).send({ error: 'Forbidden' });
		return undefined;
}
	return targetUser;
}

async function loadMatch(app: FastifyInstance, user: User, rawMatchId: string, reply: FastifyReply) {
	const errors: string[] = [];
	const matchId = coercePositiveInt(rawMatchId, 'matchId', errors);
	if (!matchId) {
		await reply.code(400).send({ error: 'Validation failed', details: errors });
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
	const opponent = await app.em.findOne(User, { id: opponentId });
	if (!opponent) errors.push('Opponent user not found');
	return opponent;
}

/**
 * Coerce integer (allows negative for guests)
 */
function coerceInt(value: unknown, field: string, errors: string[]): number | undefined {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
        errors.push(`Field ${field} must be an integer`);
        return undefined;
    }
    if (!Number.isInteger(parsed)) {
        errors.push(`Field ${field} must be an integer`);
        return undefined;
    }
    return parsed;
}

/**
 * Get or create a guest User entity for negative IDs
 * Guest users are temporary and only exist for match history purposes
 */
async function getOrCreateGuestUser(
    app: FastifyInstance, 
    guestId: number, 
    errors: string[]
): Promise<User | null> {
    if (guestId >= 0) {
        errors.push('getOrCreateGuestUser should only be called for negative IDs');
        return null;
    }

    // Generate a unique username for the guest
    const guestUsername = `guest-${Math.abs(guestId)}`;

    // Check if guest user already exists (might have been created in a previous match)
    let guestUser = await app.em.findOne(User, { 
        username: guestUsername,
        role: UserRole.GUEST 
    });

	if (!guestUser) {
        // Create a new guest user entity
        guestUser = new User();
        guestUser.id = guestId; // Use negative ID directly
        guestUser.username = guestUsername;
        guestUser.passwordHash = ''; // Guests don't have passwords
        guestUser.role = UserRole.GUEST;
        guestUser.onlineStatus = OnlineStatus.OFFLINE;
        
        try {
            app.em.persist(guestUser);
            await app.em.flush();
            app.log.info({ msg: 'Created guest user', guestId, username: guestUsername });
        } catch (error) {
            app.log.error({ msg: 'Failed to create guest user', guestId, error: String(error) });
            errors.push(`Failed to create guest user: ${String(error)}`);
            return null;
        }
    }

    return guestUser;
}

export default async function matchHistoryRoutes(app: FastifyInstance) {
	app.get<{ Params: MatchHistoryParams }>('/:userId', {
		preHandler: attachSessionUser(app),
		schema: {
			tags: ['match-history'],
			summary: 'Get match history for a user',
			params: {
				type: 'object',
				required: ['userId'],
				properties: { userId: { type: 'integer', minimum: 1 } },
			},
			response: {
				200: { type: 'array', items: matchHistoryResponseSchema },
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
			},
		},
	}, async (request: FastifyRequest<{ Params: MatchHistoryParams }>, reply: FastifyReply) => {
		if (!request.user) return;

		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) return;

		const matches = await app.em.find(
			MatchHistory,
			{ user: targetUser },
			{ orderBy: { playedAt: 'DESC' }, populate: ['user', 'opponent'] },
		);

		return reply.send(matches.map(formatMatchHistoryResponse));
	});

	app.get<{ Params: Required<MatchHistoryParams> }>('/:userId/:matchId', {
		preHandler: attachSessionUser(app),
		schema: {
			tags: ['match-history'],
			summary: 'Get a specific match entry',
			params: {
				type: 'object',
				required: ['userId', 'matchId'],
				properties: {
					userId: { type: 'integer', minimum: 1 },
					matchId: { type: 'integer', minimum: 1 },
				},
			},
			response: {
				200: matchHistoryResponseSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
			},
		},
	}, async (request, reply) => {
		if (!request.user) return;

		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) return;

	const match = await loadMatch(app, targetUser, request.params.matchId, reply);
	if (!match) return;

	return reply.send(formatMatchHistoryResponse(match));
});

	app.post<{ Body: MatchHistoryCreatePayload }>('/', {
		schema: {
			tags: ['match-history'],
			summary: 'Record a new match',
			body: {
				type: 'object',
				required: ['userId', 'opponentId', 'result', 'userScore', 'opponentScore', 'playedAt'],
				properties: {
					userId: { type: ['integer', 'string'] },
					opponentId: { type: ['integer', 'string'] },
					tournamentId: { type: ['integer', 'string', 'null'] },
					tournamentWon: { type: ['boolean', 'null'] },
					result: { type: 'string' },
					userScore: { type: ['integer', 'string'] },
					opponentScore: { type: ['integer', 'string'] },
					startTime: { type: ['string', 'null'], format: 'date-time' },
					endTime: { type: ['string', 'null'], format: 'date-time' },
					playedAt: { type: 'string', format: 'date-time' },
				},
				additionalProperties: false,
			},
			response: {
				201: matchHistoryResponseSchema,
				400: ErrorSchema,
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
			},
		},
	}, async (request: FastifyRequest<{ Body: MatchHistoryCreatePayload }>, reply: FastifyReply) => {
		const errors: string[] = [];

		// Log the incoming request for debugging
		app.log.info({
			msg: 'Match history POST request',
			body: request.body,
			headers: {
				'x-service-token': request.headers['x-service-token'] ? 'present' : 'missing',
				'authorization': request.headers['authorization'] ? 'present' : 'missing'
			}
		});

		const userId = coerceInt(request.body.userId, 'userId', errors);
		const opponentId = coerceInt(request.body.opponentId, 'opponentId', errors);
		if (userId && opponentId && userId === opponentId) {
			errors.push('Field opponentId must reference a different user than userId');
		}

		const result = normalizeResult(request.body.result, errors);
		const userScore = validateScore(request.body.userScore, 'userScore', errors);
		const opponentScore = validateScore(request.body.opponentScore, 'opponentScore', errors);

		const playedAt = parseDateField(request.body.playedAt, 'playedAt', errors, true);
		const startTime = parseDateField(request.body.startTime === null ? undefined : request.body.startTime, 'startTime', errors);
		const endTime = parseDateField(request.body.endTime === null ? undefined : request.body.endTime, 'endTime', errors);

		const tournamentId = coerceOptionalPositiveInt(request.body.tournamentId, 'tournamentId', errors);
		const tournamentWon = request.body.tournamentWon ?? null;

		// Log validation state before checking
	app.log.info({
		msg: 'Validation state',
		errors: errors,
		userId: userId,
		opponentId: opponentId,
		result: result,
		userScore: userScore,
		opponentScore: opponentScore,
		playedAt: playedAt,
		tournamentId: tournamentId
	});

	if (errors.length > 0 || !userId || !opponentId || !result || userScore === undefined || opponentScore === undefined || !playedAt) {
		app.log.error({
			msg: 'Validation failed',
			errors: errors,
			missingFields: {
				userId: !userId,
				opponentId: !opponentId,
				result: !result,
				userScore: userScore === undefined,
				opponentScore: opponentScore === undefined,
				playedAt: !playedAt
			}
		});
		return reply.code(400).send({ error: 'Validation failed', details: errors.length > 0 ? errors : ['One or more required fields are missing or invalid'] });
	}

	const isService = isServiceRequest(request);
	app.log.info({ 
		msg: 'Service request check', 
		isService, 
		hasToken: !!request.headers['x-service-token'] 
	});
		let requester: User | undefined;

		if (!isService) {
			requester = await requireSessionUser(app, request, reply);
			if (!requester) return;
		}

		let user: User | null;
		let opponent: User | null;

		// Handle user (can be registered or guest)
		if (userId! < 0) {
			// Guest user
			const guestErrors: string[] = [];
			user = await getOrCreateGuestUser(app, userId!, guestErrors);
			if (!user) {
				return reply.code(400).send({ error: 'Validation failed', details: guestErrors });
			}
		} else {
			// Registered user
			user = await app.em.findOne(User, { id: userId });
			if (!user) return reply.code(404).send({ error: 'User not found' });

			if (!isService && requester && requester.id !== user.id && requester.role !== UserRole.ADMIN) {
				return reply.code(403).send({ error: 'Forbidden' });
			}
		}

		// Handle opponent (can be registered or guest)
		if (opponentId! < 0) {
			// Guest user
			const guestErrors: string[] = [];
			opponent = await getOrCreateGuestUser(app, opponentId!, guestErrors);
			if (!opponent) {
				return reply.code(400).send({ error: 'Validation failed', details: guestErrors });
			}
		} else {
			// Registered user
			const opponentErrors: string[] = [];
			opponent = await resolveOpponent(app, opponentId!, opponentErrors);
			if (!opponent) {
				return reply.code(404).send({ error: 'Validation failed', details: opponentErrors });
			}
		}

		const durationSeconds =
            startTime  && endTime
                ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000))
                : undefined;

		const primary = new MatchHistory();
		primary.user = user;
		primary.opponent = opponent;
		primary.tournamentId = tournamentId ?? undefined;
		primary.tournamentWon = tournamentWon ?? undefined;
		primary.result = result;
		primary.userScore = userScore;
		primary.opponentScore = opponentScore;
		primary.startTime = startTime === null ? undefined : startTime ?? undefined;
		primary.endTime = endTime === null ? undefined : endTime ?? undefined;
		primary.playedAt = playedAt;

		const mirrored = new MatchHistory();
		mirrored.user = opponent;
		mirrored.opponent = user;
		mirrored.tournamentId = tournamentId ?? undefined;
		mirrored.tournamentWon = tournamentWon === true ? false : tournamentWon === false ? true : undefined;
		mirrored.result = invertResult(result);
		mirrored.userScore = opponentScore;
		mirrored.opponentScore = userScore;
		mirrored.startTime = primary.startTime;
		mirrored.endTime = primary.endTime;
		mirrored.playedAt = playedAt;

		await app.em.persist([primary, mirrored]);

		const userStats = await loadOrCreateStats(app, user);
		const opponentStats = await loadOrCreateStats(app, opponent);

		applyMatchToStats(userStats, result, playedAt, durationSeconds, tournamentId ?? undefined, tournamentWon);
		applyMatchToStats(opponentStats, mirrored.result, playedAt, durationSeconds, tournamentId ?? undefined, mirrored.tournamentWon ?? null);

		await app.em.flush();
		await app.em.populate(primary, ['user', 'opponent']);

		return reply.code(201).send(formatMatchHistoryResponse(primary));
	});

	app.patch<{ Params: Required<MatchHistoryParams>; Body: MatchHistoryUpdatePayload }>(
		'/:userId/:matchId',
		{
			preHandler: attachSessionUser(app),
			schema: {
				tags: ['match-history'],
				summary: 'Update a match entry',
				params: {
					type: 'object',
					required: ['userId', 'matchId'],
					properties: {
						userId: { type: 'integer', minimum: 1 },
						matchId: { type: 'integer', minimum: 1 },
					},
				},
				body: {
					type: 'object',
					additionalProperties: false,
					properties: {
						opponentId: { type: ['integer', 'string'] },
						tournamentId: { type: ['integer', 'string', 'null'] },
						tournamentWon: { type: ['boolean', 'null'] },
						result: { type: 'string' },
						userScore: { type: ['integer', 'string'] },
						opponentScore: { type: ['integer', 'string'] },
						startTime: { type: ['string', 'null'], format: 'date-time' },
						endTime: { type: ['string', 'null'], format: 'date-time' },
						playedAt: { type: ['string', 'null'], format: 'date-time' },
					},
				},
				response: {
					200: matchHistoryResponseSchema,
					400: ErrorSchema,
					401: ErrorSchema,
					403: ErrorSchema,
					404: ErrorSchema,
				},
			},
		},
		async (request, reply) => {
			if (!request.user) return;

			if (!request.body || typeof request.body !== 'object') {
				return reply.code(400).send({ error: 'Request body must be an object' });
			}

			const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
			if (!targetUser) return;

			const match = await loadMatch(app, targetUser, request.params.matchId, reply);
			if (!match) return;

			const errors: string[] = [];

			if (request.body.result !== undefined) {
				const normalized = normalizeResult(request.body.result, errors);
				if (normalized) match.result = normalized;
			}

			if (request.body.opponentId !== undefined) {
				const opponentId = coercePositiveInt(request.body.opponentId, 'opponentId', errors);
				if (opponentId && opponentId !== targetUser.id) {
					const resolvedOpponent = await resolveOpponent(app, opponentId, errors);
					if (resolvedOpponent) {
						match.opponent = resolvedOpponent;
					}
				} else if (opponentId === targetUser.id) {
					errors.push('Field opponentId must reference a different user than userId');
				}
			}

			const startTime = parseDateField(request.body.startTime ?? undefined, 'startTime', errors);
			const endTime = parseDateField(request.body.endTime ?? undefined, 'endTime', errors);
			const playedAt = parseDateField(request.body.playedAt ?? undefined, 'playedAt', errors, false);

			const userScore = validateScore(request.body.userScore ?? undefined, 'userScore', errors, false);
			const opponentScore = validateScore(request.body.opponentScore ?? undefined, 'opponentScore', errors, false);

			if (errors.length > 0) {
				return reply.code(400).send({ error: 'Validation failed', details: errors });
			}

			if (request.body.tournamentId !== undefined) {
				const newTournamentId = coerceOptionalPositiveInt(request.body.tournamentId, 'tournamentId', errors);
				if (errors.length > 0) {
					return reply.code(400).send({ error: 'Validation failed', details: errors });
				}
				match.tournamentId = newTournamentId ?? undefined;
			}

			if (request.body.tournamentWon !== undefined) {
				match.tournamentWon = request.body.tournamentWon ?? undefined;
			}

			if (userScore !== undefined) match.userScore = userScore;
			if (opponentScore !== undefined) match.opponentScore = opponentScore;
			if (startTime !== undefined) match.startTime = startTime === null ? undefined : startTime;
			if (endTime !== undefined) match.endTime = endTime === null ? undefined : endTime;
			if (playedAt !== undefined && playedAt) match.playedAt = playedAt;

			await app.em.flush();
			await app.em.populate(match, ['user', 'opponent']);

			return reply.send(formatMatchHistoryResponse(match));
		},
	);

	app.delete<{ Params: Required<MatchHistoryParams> }>('/:userId/:matchId', {
		preHandler: attachSessionUser(app),
		schema: {
			tags: ['match-history'],
			summary: 'Delete a match entry',
			params: {
				type: 'object',
				required: ['userId', 'matchId'],
				properties: {
					userId: { type: 'integer', minimum: 1 },
					matchId: { type: 'integer', minimum: 1 },
				},
			},
			response: {
				204: { type: 'null' },
				401: ErrorSchema,
				403: ErrorSchema,
				404: ErrorSchema,
			},
		},
	}, async (request, reply) => {
		if (!request.user) return;

		const targetUser = await resolveTargetUser(app, request.params.userId, request, reply);
		if (!targetUser) return;

		const match = await loadMatch(app, targetUser, request.params.matchId, reply);
		if (!match) return;

		await app.em.removeAndFlush(match);
		return reply.code(204).send();
	});
}