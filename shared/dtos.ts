// Shared DTOs (Data Transfer Objects) for ft_transcendence microservices

export interface CreateUserDto {
  username: string;
  password: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  username?: string;
  avatarUrl?: string;
  onlineStatus?: 'online' | 'offline' | 'away' | 'in_game' | 'busy';
  activityType?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface TwoFactorSetupDto {
  otp: string;
  tempSecretToken: string;
}

export interface TwoFactorDisableDto {
  otp?: string;
  recovery_code?: string;
}

export interface DeleteAccountDto {
  password?: string;
  otp?: string;
}

export interface GameDto {
  id: string;
  player1Id: number;
  player2Id: number;
  gameType: 'pong' | 'tournament';
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  score1: number;
  score2: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentDto {
  id: number;
  name: string;
  description?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'active' | 'finished' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  winnerId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JoinTournamentDto {
  tournamentId: number;
  userId: number;
}
