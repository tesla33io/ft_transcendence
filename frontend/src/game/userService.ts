import { ApiService } from './apiService';
import type { 
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    PublicUser,
    UserStatistics,
    UserWithStats,
    MatchHistoryWithUsers,
    UserProfileData,
    ProfileUpdateRequest,
} from '../types';


import  {
    OnlineStatus,
    UserRole,
    MatchResult
} from '../types';

export interface TournamentStatistics {
    tournamentWins: number;
    tournamentsParticipated: number;
    winLossPercentage: number;
    userId: number;
}

export class UserService {
    // ===== AUTHENTICATION (SENDERS) =====
    
    // Send login request
    static async login(credentials: LoginRequest): Promise<AuthResponse> {
        // TODO: Uncomment when backend is ready
        // const authData = await ApiService.post<AuthResponse>('/auth/login', credentials);
        
        // Mock response for now
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        const mockAuthData: AuthResponse = {
            user: {
                id: 123,
                username: credentials.username,
                avatarUrl: '/images/default-avatar.png',
                onlineStatus: OnlineStatus.ONLINE,
                activityType: 'browsing',
                role: UserRole.USER,
                lastLogin: new Date().toISOString()
            },
            token: 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h from now
        };
        
        // Save token and user info after successful login
        localStorage.setItem('authToken', mockAuthData.token);
        localStorage.setItem('user', JSON.stringify(mockAuthData.user));
        
        return mockAuthData;
    }

    // Send registration request
    static async register(userData: RegisterRequest): Promise<AuthResponse> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.post<AuthResponse>('/auth/register', userData);
        
        // Mock response for now
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const mockAuthData: AuthResponse = {
            user: {
                id: Math.floor(Math.random() * 1000),
                username: userData.username,
                avatarUrl: userData.avatarUrl || '/images/default-avatar.png',
                onlineStatus: OnlineStatus.ONLINE,
                role: UserRole.USER,
                lastLogin: new Date().toISOString()
            },
            token: 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem('authToken', mockAuthData.token);
        localStorage.setItem('user', JSON.stringify(mockAuthData.user));
        
        return mockAuthData;
    }

    // Send logout request & clear local data
    static async logout(): Promise<void> {
        try {
            // TODO: Uncomment when backend is ready
            // await ApiService.post<void>('/auth/logout', {});
            
            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }

    // ===== USER DATA (GETTERS) =====
    
    // Get current user's profile
    static async getCurrentUser(): Promise<PublicUser> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<PublicUser>('/users/me');
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const storedUser = this.getCurrentUserFromStorage();
        if (!storedUser) throw new Error('Not logged in');
        
        return storedUser;
    }

    // Get any user's public profile
    static async getUser(userId: number): Promise<PublicUser> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<PublicUser>(`/users/${userId}`);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            id: userId,
            username: `User${userId}`,
            avatarUrl: '/images/default-avatar.png',
            onlineStatus: Math.random() > 0.5 ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE,
            activityType: 'playing pong',
            role: UserRole.USER,
            lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    // Get current user's statistics
    static async getCurrentUserStats(): Promise<UserStatistics> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<UserStatistics>('/users/me/stats');
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) throw new Error('Not logged in');
        
        return {
            userId: currentUser.id,
            totalGames: 45,
            wins: 28,
            losses: 15,
            draws: 2,
            averageGameDuration: 180, // 3 minutes
            longestGame: 420, // 7 minutes
            bestWinStreak: 8,
            currentRating: 1650,
            highestRating: 1720,
            ratingChange: 25, // Last game +25
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            updatedAt: new Date().toISOString(),
            lastGameAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        };
    }

    // Get any user's statistics  
    static async getUserStats(userId: number): Promise<UserStatistics> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<UserStatistics>(`/users/${userId}/stats`);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            userId: userId,
            totalGames: Math.floor(Math.random() * 100) + 10,
            wins: Math.floor(Math.random() * 60) + 5,
            losses: Math.floor(Math.random() * 40) + 5,
            draws: Math.floor(Math.random() * 5),
            averageGameDuration: Math.floor(Math.random() * 120) + 60,
            longestGame: Math.floor(Math.random() * 300) + 180,
            bestWinStreak: Math.floor(Math.random() * 15) + 1,
            currentRating: Math.floor(Math.random() * 1000) + 1000,
            highestRating: Math.floor(Math.random() * 1200) + 1000,
            ratingChange: Math.floor(Math.random() * 60) - 30,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            lastGameAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    // Get user WITH statistics (combined)
    static async getUserWithStats(userId?: number): Promise<UserWithStats> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/with-stats` : '/users/me/with-stats';
        // return await ApiService.get<UserWithStats>(endpoint);
        
        // Mock response using other mock methods
        const user = userId ? await this.getUser(userId) : await this.getCurrentUser();
        const statistics = userId ? await this.getUserStats(userId) : await this.getCurrentUserStats();
        
        return { user, statistics };
    }

    // Get current user's match history
    static async getCurrentUserMatches(): Promise<MatchHistoryWithUsers[]> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<MatchHistoryWithUsers[]>('/users/me/matches');
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) throw new Error('Not logged in');
        
        const mockMatches: MatchHistoryWithUsers[] = [];
        const opponents = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
        
        for (let i = 0; i < 10; i++) {
            const isWin = Math.random() > 0.4;
            const userScore = isWin ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 3);
            const opponentScore = isWin ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 3) + 3;
            
            mockMatches.push({
                id: i + 1,
                user: currentUser,
                opponent: {
                    id: i + 100,
                    username: opponents[i % opponents.length],
                    avatarUrl: '/images/default-avatar.png',
                    onlineStatus: OnlineStatus.OFFLINE,
                    role: UserRole.USER
                },
                result: isWin ? MatchResult.WIN : MatchResult.LOSS,
                userScore,
                opponentScore,
                playedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
                startTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 180000).toISOString(),
                gameDuration: 180 + Math.floor(Math.random() * 120)
            });
        }
        
        return mockMatches;
    }

    // Get complete profile data (profile + stats + matches)
    static async getProfileData(userId?: number): Promise<UserProfileData> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/profile-data` : '/users/me/profile-data';
        // return await ApiService.get<UserProfileData>(endpoint);
        
        // Mock response using other mock methods
        const userWithStats = await this.getUserWithStats(userId);
        const recentMatches = userId ? await this.getUserMatches(userId) : await this.getCurrentUserMatches();
        
        return {
            profile: userWithStats.user,
            statistics: userWithStats.statistics,
            recentMatches: recentMatches.slice(0, 5), // Only recent 5 matches
        };
    }

    // Get any user's match history
    static async getUserMatches(userId: number): Promise<MatchHistoryWithUsers[]> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<MatchHistoryWithUsers[]>(`/users/${userId}/matches`);
        
        // Mock response similar to getCurrentUserMatches
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const user = await this.getUser(userId);
        const opponents = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'];
        const mockMatches: MatchHistoryWithUsers[] = [];
        
        for (let i = 0; i < 7; i++) {
            const isWin = Math.random() > 0.5;
            mockMatches.push({
                id: i + 1000,
                user,
                opponent: {
                    id: i + 200,
                    username: opponents[i % opponents.length],
                    avatarUrl: '/images/default-avatar.png',
                    onlineStatus: OnlineStatus.OFFLINE,
                    role: UserRole.USER
                },
                result: isWin ? MatchResult.WIN : MatchResult.LOSS,
                userScore: isWin ? 3 : Math.floor(Math.random() * 3),
                opponentScore: isWin ? Math.floor(Math.random() * 3) : 3,
                playedAt: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return mockMatches;
    }

    // ===== USER UPDATES (SENDERS) =====
    
    // Update current user's profile
    static async updateProfile(updates: ProfileUpdateRequest): Promise<PublicUser> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.post<PublicUser>('/users/me/profile', updates);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) throw new Error('Not logged in');
        
        const updatedUser: PublicUser = {
            ...currentUser,
            ...updates
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return updatedUser;
    }

    // Update avatar
    static async updateAvatar(avatarUrl: string): Promise<PublicUser> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.post<PublicUser>('/users/me/avatar', { avatarUrl });
        
        return await this.updateProfile({ avatarUrl });
    }

    // ===== TOURNAMENT STATISTICS =====
    
    // Get current user's tournament statistics
    static async getCurrentUserTournamentStats(): Promise<TournamentStatistics> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<TournamentStatistics>('/users/me/tournament-stats');
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) throw new Error('Not logged in');
        
        const tournamentWins = Math.floor(Math.random() * 15) + 2;
        const tournamentsParticipated = tournamentWins + Math.floor(Math.random() * 25) + 5;
        const winLossPercentage = Math.round((tournamentWins / tournamentsParticipated) * 100);
        
        return {
            userId: currentUser.id,
            tournamentWins,
            tournamentsParticipated,
            winLossPercentage
        };
    }

    // Get any user's tournament statistics
    static async getUserTournamentStats(userId: number): Promise<TournamentStatistics> {
        // TODO: Uncomment when backend is ready
        // return await ApiService.get<TournamentStatistics>(`/users/${userId}/tournament-stats`);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const tournamentWins = Math.floor(Math.random() * 20) + 1;
        const tournamentsParticipated = tournamentWins + Math.floor(Math.random() * 30) + 3;
        const winLossPercentage = Math.round((tournamentWins / tournamentsParticipated) * 100);
        
        return {
            userId,
            tournamentWins,
            tournamentsParticipated,
            winLossPercentage
        };
    }

    // ===== UTILITY FUNCTIONS =====
    
    // Check if user is logged in
    static isLoggedIn(): boolean {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }

    // Get current user from localStorage (no API call)
    static getCurrentUserFromStorage(): PublicUser | null {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    // Get auth token
    static getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    }

    // Clear all user data (for logout)
    static clearUserData(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
}