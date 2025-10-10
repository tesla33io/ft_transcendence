// Shared types and interfaces for ft_transcendence microservices

export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  onlineStatus: 'online' | 'offline' | 'away' | 'in_game' | 'busy';
  activityType?: string;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
}

export interface UserStatistics {
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
  createdAt: Date;
  updatedAt: Date;
  lastGameAt?: Date;
}

export interface MatchHistory {
  id: number;
  userId: number;
  opponentId: number;
  tournamentId?: number;
  tournamentWon?: boolean;
  result: 'win' | 'loss' | 'draw' | 'forfeit' | 'timeout';
  userScore: number;
  opponentScore: number;
  startTime?: Date;
  endTime?: Date;
  playedAt: Date;
}

export interface AuthToken {
  id: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
