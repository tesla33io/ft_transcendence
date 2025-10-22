import '../types/fastify';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import argon2 from 'argon2';
import { User, UserRole } from '../entities/User';
import { UserStatistics } from '../entities/UserStatistics';

// Authentication middleware reused from user routes
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

interface UserCreatePayload {
  username: string;
  password: string;
}

interface StatsParams {
  userId: string;
}

interface StatsResponse {
  id: number;
  userId: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  averageGameDuration: number;
  longestGame: number;
  bestWinStreak: number;
  currentRating: number;
  highestRating: number;
  ratingChange: number;
  overallTournamentWon: number;
  tournamentsParticipated: number;
  winPercentage: number;
  tournamentWinRate: number;
  createdAt: string;
  updatedAt: string;
  lastGameAt: string | null;
}

interface StatsUpdatePayload {
  totalGames?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  averageGameDuration?: number;
  longestGame?: number;
  bestWinStreak?: number;
  currentRating?: number;
  highestRating?: number;
  ratingChange?: number;
  overallTournamentWon?: number;
  tournamentsParticipated?: number;
  createdAt?: string;
  updatedAt?: string;
  lastGameAt?: string | null;
}

const NUMERIC_FIELDS: Array<keyof StatsUpdatePayload> = [
  'totalGames',
  'wins',
  'losses',
  'draws',
  'averageGameDuration',
  'longestGame',
  'bestWinStreak',
  'currentRating',
  'highestRating',
  'ratingChange',
  'overallTournamentWon',
  'tournamentsParticipated',
];

const DATE_FIELDS: Array<keyof StatsUpdatePayload> = ['createdAt', 'updatedAt', 'lastGameAt'];

function formatStatsResponse(stats: UserStatistics): StatsResponse {
  const createdAtIso = stats.createdAt instanceof Date ? stats.createdAt.toISOString() : new Date().toISOString();
  const updatedAtIso = stats.updatedAt instanceof Date ? stats.updatedAt.toISOString() : createdAtIso;

  return {
    id: stats.id,
    userId: stats.user.id,
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    averageGameDuration: stats.averageGameDuration,
    longestGame: stats.longestGame,
    bestWinStreak: stats.bestWinStreak,
    currentRating: stats.currentRating,
    highestRating: stats.highestRating,
    ratingChange: stats.ratingChange,
    overallTournamentWon: stats.overallTournamentWon,
    tournamentsParticipated: stats.tournamentsParticipated,
    winPercentage: stats.calculateWinPercentage(),
    tournamentWinRate: stats.calculateTournamentWinRate(),
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    lastGameAt: stats.lastGameAt instanceof Date ? stats.lastGameAt.toISOString() : null,
  };
}

async function resolveUser(app: FastifyInstance, userIdParam: string, request: FastifyRequest, reply: FastifyReply): Promise<User | undefined> {
  const userId = Number(userIdParam);

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

function applyNumericUpdates(stats: UserStatistics, payload: StatsUpdatePayload, errors: string[]) {
  for (const field of NUMERIC_FIELDS) {
    if (payload[field] === undefined) {
      continue;
    }

    const value = payload[field];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      errors.push(`Field ${field} must be a finite number`);
      continue;
    }

    (stats as any)[field] = value;
  }
}

function applyDateUpdates(stats: UserStatistics, payload: StatsUpdatePayload, errors: string[]) {
  for (const field of DATE_FIELDS) {
    if (payload[field] === undefined) {
      continue;
    }

    const value = payload[field];
    if (value === null && field === 'lastGameAt') {
      stats.lastGameAt = undefined;
      continue;
    }

    if (typeof value !== 'string') {
      errors.push(`Field ${field} must be an ISO string or null`);
      continue;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      errors.push(`Field ${field} must be a valid ISO date string`);
      continue;
    }

    if (field === 'lastGameAt') {
      stats.lastGameAt = parsed;
    } else if (field === 'createdAt') {
      stats.createdAt = parsed;
    } else if (field === 'updatedAt') {
      stats.updatedAt = parsed;
    }
  }
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

export default async function userStatisticsRoutes(app: FastifyInstance) {
  // Example POST route to create a new user and their stats
  app.post<{ Body: UserCreatePayload }>('/', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await app.em.findOne(User, { username });
    if (existingUser) {
      return reply.code(409).send({ error: 'User with that username already exists' });
    }

    // 1. Create new User entity
    const newUser = new User();
    newUser.username = username;

    // Hash the password
    newUser.passwordHash = await argon2.hash(password);

    // 2. Persist the new user and create their stats
    await app.em.persist(newUser);
    const newStats = await loadOrCreateStats(app, newUser);
    await app.em.flush(); // This saves both the new user and their new stats

    return reply.code(201).send(formatStatsResponse(newStats));
  });

  app.get<{
    Params: StatsParams;
  }>('/:userId', { preHandler: authenticateToken(app) }, async (request, reply) => {
    const user = await resolveUser(app, request.params.userId, request, reply);
    if (!user) {
      return;
    }

    const stats = await loadOrCreateStats(app, user);

    await app.em.flush(); // ensure new stats are persisted if created during load
    await app.em.populate(stats, ['user']);

    return reply.send(formatStatsResponse(stats));
  });

  app.patch<{
    Params: StatsParams;
    Body: StatsUpdatePayload;
  }>('/:userId', { preHandler: authenticateToken(app) }, async (request, reply) => {
    if (!request.body || typeof request.body !== 'object') {
      return reply.code(400).send({ error: 'Request body must be an object' });
    }

    const user = await resolveUser(app, request.params.userId, request, reply);
    if (!user) {
      return;
    }

    const stats = await loadOrCreateStats(app, user);

    const errors: string[] = [];
    applyNumericUpdates(stats, request.body, errors);
    applyDateUpdates(stats, request.body, errors);

    if (errors.length > 0) {
      return reply.code(400).send({ error: 'Validation failed', details: errors });
    }

    if (!('updatedAt' in request.body)) {
      stats.updatedAt = new Date();
    }

    await app.em.flush();
    await app.em.populate(stats, ['user']);

    return reply.send(formatStatsResponse(stats));
  });
}
