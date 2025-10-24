import { ApiService } from './apiService';

import type { 
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    PublicUser,
    ProfileUpdateRequest,
} from '../types';


import  {
    OnlineStatus,
    UserRole,
} from '../types';

export interface Friend {
	userId: number;
	userName: string;
	isOnline: boolean;
	lastOnlineAt: string;
	avatarUrl?: string;
}

export interface FriendRequest {
	userId: number;
	userName: string;
	requestSendDate: string;
	avatarUrl?: string;
}

export interface OneVOneStatistics {
    userId: number;
    userName: string;
    gamesWon: number;
    gamesLost: number;
    winPercentage: number;
    currentWinStreak: number;
    longestWinStreak: number;
    currentRating?: number; // ELO rating 
    peakRating?: number;
}

export interface PlayerVsAIStatistics {
    userId: number;
    userName: string;
    gamesWon: number;
    gamesLost: number;
    winPercentage: number;
    currentWinStreak: number;
    longestWinStreak: number;
    difficultyStats?: {
        easy: { wins: number; losses: number };
        medium: { wins: number; losses: number };
        hard: { wins: number; losses: number };
    };
}

export interface TournamentStatistics {
    userId: number;
    userName: string;
    tournamentsWon: number;        
    tournamentsParticipated: number;
    winPercentage: number;        
    bestPlacement?: number;   
}

export interface MatchHistoryEntry {
    matchId: number;
    opponentId: number;
    opponentName: string;
    isWin: boolean;
    userScore: number;
    opponentScore: number;
    date: string;
    opponentElo: number;
    eloGained: number; // Can be negative for losses
    matchDuration?: number; // in seconds
}

export interface UserProfile {
    userId: number;
    userName: string;
    avatarUrl?: string;
    bioText?: string;
    isOnline: boolean;
    lastOnline: string;
    accountCreationDate: string;
    currentElo?: number;
}

export class UserService {
    // ===== AUTHENTICATION (SENDERS) ====
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


	// ===== FRIENDS API METHODS =====

	// Get current user's friends list
	static async getFriends(): Promise<Friend[]> {
		// TODO: Uncomment when backend is ready
		// return await ApiService.get<Friend[]>('/users/me/friends');
		
		// Mock response
		await new Promise(resolve => setTimeout(resolve, 300));
		
		const mockFriends: Friend[] = [
			{
				userId: 101,
				userName: "Alice_Gamer",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '../views/images/rabit.png'//dosent work yet need to implement a place to put all pictures 
			},
			{
				userId: 102,
				userName: "Bob_Pro",
				isOnline: true,
				lastOnlineAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 103,
				userName: "Charlie_Win",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 104,
				userName: "Diana_Fast",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 105,
				userName: "Eve_Champion69",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1062,
				userName: "Frank_Master420",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1052,
				userName: "Eve_Champion",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1069,
				userName: "Frank_Master1",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				avatarUrl: './views/images/rabit.png'
			},
				{
				userId: 1054,
				userName: "Eve_Champion4",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1066,
				userName: "Frank_Master288",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1052,
				userName: "Eve_Champion99",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1069,
				userName: "Frank_Master187",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				avatarUrl: './views/images/rabit.png'
			},
				{
				userId: 1054,
				userName: "Eve_Champion44",
				isOnline: true,
				lastOnlineAt: new Date().toISOString(),
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 1066,
				userName: "Frank_Master2200",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 107,
				userName: "Grace_Elite",
				isOnline: false,
				lastOnlineAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
				avatarUrl: '/images/default-avatar.png'
			}
		];
		
		return mockFriends;
	}

	// Get friend requests
	static async getFriendRequests(): Promise<FriendRequest[]> {
		// TODO: Uncomment when backend is ready
		// return await ApiService.get<FriendRequest[]>('/users/me/friend-requests');
		
		// Mock response
		await new Promise(resolve => setTimeout(resolve, 200));
		
		const mockRequests: FriendRequest[] = [
			{
				userId: 201,
				userName: "NewPlayer_123",
				requestSendDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
				avatarUrl: '/images/default-avatar.png'
			},
			{
				userId: 202,
				userName: "PongMaster_99",
				requestSendDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
				avatarUrl: '/images/default-avatar.png'
			}
		];
		
		return mockRequests;
	}

	// Send friend request
	static async sendFriendRequest(friendsName: string): Promise<{ success: boolean; message: string }> {
		// TODO: Uncomment when backend is ready
		// return await ApiService.post<{ success: boolean; message: string }>('/users/me/friend-requests', { friendsName });
		
		// Mock response
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Simulate different responses
		if (friendsName.toLowerCase() === 'invalid') {
			return { success: false, message: 'User does not exist' };
		}
		if (friendsName.toLowerCase() === 'already') {
			return { success: false, message: 'Friend request already sent' };
		}
		
		return { success: true, message: 'Friend request sent successfully' };
	}

	// Accept friend request
	static async acceptFriendRequest(otherUserName: string): Promise<{ success: boolean; message: string }> {
		// TODO: Uncomment when backend is ready
		// const currentUser = this.getCurrentUserFromStorage();
		// if (!currentUser) throw new Error('Not logged in');
		// return await ApiService.post<{ success: boolean; message: string }>('/users/me/friend-requests/accept', {
		//     myUserID: currentUser.id,
		//     myUsername: currentUser.username,
		//     otherUserName
		// });
		
		// Mock response
		await new Promise(resolve => setTimeout(resolve, 400));
		
		return { success: true, message: 'Friend request accepted' };
	}

	// Reject friend request
	static async rejectFriendRequest(otherUserName: string): Promise<{ success: boolean; message: string }> {
		// TODO: Uncomment when backend is ready
		// return await ApiService.post<{ success: boolean; message: string }>('/users/me/friend-requests/reject', { otherUserName });
		
		// Mock response
		await new Promise(resolve => setTimeout(resolve, 300));
		
		return { success: true, message: 'Friend request rejected' };
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

    // ===== PROFILE & STATISTICS API METHODS =====

    // Get user profile
    static async getUserProfile(userId?: number): Promise<UserProfile> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}` : '/users/me';
        // return await ApiService.get<UserProfile>(endpoint);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockProfile: UserProfile = {
            userId: userId || 1,
            userName: userId ? `User_${userId}` : "CurrentUser",
            avatarUrl: '/images/default-avatar.png',
            bioText: userId ? "This is a friend's profile!" : "This is my awesome bio! I love playing pong and competing in tournaments.",
            isOnline: userId ? Math.random() > 0.5 : true,
            lastOnline: new Date().toISOString(),
            accountCreationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            currentElo: Math.floor(1000 + Math.random() * 1000)
        };
        
        return mockProfile;
    }

    // Get 1v1 statistics
    static async getOneVOneStatistics(userId?: number): Promise<OneVOneStatistics> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/stats/1v1` : '/users/me/stats/1v1';
        // return await ApiService.get<OneVOneStatistics>(endpoint);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const gamesWon = Math.floor(Math.random() * 50) + 10;
        const gamesLost = Math.floor(Math.random() * 40) + 5;
        const totalGames = gamesWon + gamesLost;
        
        const mockStats: OneVOneStatistics = {
            userId: userId || 1,
            userName: userId ? `User_${userId}` : "CurrentUser",
            gamesWon,
            gamesLost,
            winPercentage: Math.round((gamesWon / totalGames) * 100),
            currentWinStreak: Math.floor(Math.random() * 8),
            longestWinStreak: Math.floor(Math.random() * 15) + 3,
            currentRating: Math.floor(1000 + Math.random() * 1000),
            peakRating: Math.floor(1200 + Math.random() * 800)
        };
        
        return mockStats;
    }

    // Get Player vs AI statistics
    static async getPlayerVsAIStatistics(userId?: number): Promise<PlayerVsAIStatistics> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/stats/ai` : '/users/me/stats/ai';
        // return await ApiService.get<PlayerVsAIStatistics>(endpoint);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const gamesWon = Math.floor(Math.random() * 30) + 5;
        const gamesLost = Math.floor(Math.random() * 20) + 3;
        const totalGames = gamesWon + gamesLost;
        
        const mockStats: PlayerVsAIStatistics = {
            userId: userId || 1,
            userName: userId ? `User_${userId}` : "CurrentUser",
            gamesWon,
            gamesLost,
            winPercentage: Math.round((gamesWon / totalGames) * 100),
            currentWinStreak: Math.floor(Math.random() * 5),
            longestWinStreak: Math.floor(Math.random() * 10) + 2,
            difficultyStats: {
                easy: { wins: Math.floor(gamesWon * 0.5), losses: Math.floor(gamesLost * 0.2) },
                medium: { wins: Math.floor(gamesWon * 0.3), losses: Math.floor(gamesLost * 0.4) },
                hard: { wins: Math.floor(gamesWon * 0.2), losses: Math.floor(gamesLost * 0.4) }
            }
        };
        
        return mockStats;
    }

    // Get tournament statistics
    static async getTournamentStatistics(userId?: number): Promise<TournamentStatistics> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/stats/tournaments` : '/users/me/stats/tournaments';
        // return await ApiService.get<TournamentStatistics>(endpoint);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const tournamentsWon = Math.floor(Math.random() * 8) + 1;        // ✅ Fixed variable name
        const tournamentsParticipated = tournamentsWon + Math.floor(Math.random() * 15) + 2;
        
        const mockStats: TournamentStatistics = {
            userId: userId || 1,
            userName: userId ? `User_${userId}` : "CurrentUser",
            tournamentsWon,                                              // ✅ Use consistent property name
            tournamentsParticipated,
            winPercentage: Math.round((tournamentsWon / tournamentsParticipated) * 100), // ✅ Fixed property name
            bestPlacement: Math.floor(Math.random() * 3) + 1            // ✅ Add missing property
        };
        
        return mockStats;
    }


    // Get match history
    static async getMatchHistory(userId?: number): Promise<MatchHistoryEntry[]> {
        // TODO: Uncomment when backend is ready
        // const endpoint = userId ? `/users/${userId}/matches` : '/users/me/matches';
        // return await ApiService.get<MatchHistoryEntry[]>(`${endpoint}?limit=${limit}`);
        
        // Mock response
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const mockMatches: MatchHistoryEntry[] = [];
        
        const opponents = [
            'AliceGamer', 'BobPro', 'CharlieWin', 'DianaFast', 'EveChampion',
            'FrankMaster', 'GraceElite', 'HenrySkill', 'IvyStrong', 'JackSpeed'
        ];
        
        for (let i = 0; i < Math.min(30, 20); i++) {
            const isWin = Math.random() > 0.45; // Slightly favor wins
            const userScore = isWin ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 3) + 1;
            const opponentScore = isWin ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 3) + 3;
            const eloChange = isWin ? Math.floor(Math.random() * 30) + 10 : -(Math.floor(Math.random() * 25) + 5);
            
            mockMatches.push({
                matchId: 1000 + i,
                opponentId: Math.floor(Math.random() * 1000) + 100,
                opponentName: opponents[Math.floor(Math.random() * opponents.length)],
                isWin,
                userScore,
                opponentScore,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                opponentElo: Math.floor(800 + Math.random() * 1200),
                eloGained: eloChange,
                matchDuration: Math.floor(Math.random() * 300) + 60 // 1-6 minutes
            });
        }
        
        // Sort by date (newest first)
        mockMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return mockMatches;
    }
}


