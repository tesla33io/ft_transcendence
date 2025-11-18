import { ApiService } from './apiService';

import type { 
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    PublicUser,
    ProfileUpdateRequest,
    RegistrationResponse, // Add this
    Login2FAChallenge, // Add this
} from '../types';


import  {
    OnlineStatus,
    UserRole,
} from '../types';

export interface Friend {
    id: string;
    username: string;
    avatarUrl: string | null;
    onlineStatus: 'online' | 'offline' | 'away';
    activityType: string | null;   
    activityDetails: string | null;
    lastOnlineAt: string | null;
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
    // In-memory role cache (not localStorage for security)
    private static roleCache: { role: string; timestamp: number } | null = null;
    private static CACHE_DURATION = 60000; // 1 minute

    // ===== HELPER METHODS =====
    
    /**
     * Safely convert string role to UserRole enum
     * Defaults to USER if invalid role received
     */
    

    // ===== AUTHENTICATION (SENDERS) ====
    // Send login request
    static async login(credentials: LoginRequest): Promise<AuthResponse | Login2FAChallenge> {
    const response = await ApiService.post<{
        id?: number;
        username?: string;
        role?: string;
        message?: string;
        accessToken?: string;
        refreshToken?: string;
        requires2FA?: boolean;
        method?: 'totp';
    }>('/users/auth/login', credentials);
    
    console.log('🔵 [LOGIN] Full response:', response);
    console.log('🔵 [LOGIN] requires2FA:', response.requires2FA);
    console.log('🔵 [LOGIN] message:', response.message);
    
    // Check if 2FA is required - check both requires2FA flag and message content
    if (response.requires2FA === true || 
        (response.message && response.message.toLowerCase().includes('authenticator'))) {
        console.log('🔵 [LOGIN] 2FA required, returning challenge');
        return {
            requires2FA: true,
            method: response.method || 'totp',
            message: response.message || 'Enter code from authenticator app'
        };
    }
    
    // Normal login successful
    console.log('✅ [LOGIN] Login successful!');
    console.log('✅ [LOGIN] User ID:', response.id);
    console.log('✅ [LOGIN] Username:', response.username);
    console.log('✅ [LOGIN] Access Token:', response.accessToken?.substring(0, 20) + '...');
    
    // Validate response has required fields
    if (!response.id || !response.username) {
        console.error('❌ [LOGIN] Login response missing required fields:', response);
        throw new Error('Invalid login response: missing user information');
    }
    
    // Store tokens and user data
    localStorage.setItem('authToken', response.accessToken || '');
    localStorage.setItem('userId', response.id.toString());
    localStorage.setItem('username', response.username);
    
    // Create AuthResponse with real data from gateway
    const authData: AuthResponse = {
        user: {
            id: response.id,
            username: response.username,
            avatarUrl: '/images/default-avatar.png',
            onlineStatus: OnlineStatus.ONLINE,
            activityType: 'browsing',
            role: response.role || UserRole.USER,
            lastLogin: new Date().toISOString()
        },
        token: response.accessToken || '',
    };
    
    return authData;
}

   // Send registration request
	static async register(userData: RegisterRequest): Promise<AuthResponse | RegistrationResponse> {
		const response = await ApiService.post<RegistrationResponse>('/users/auth/register', {
			username: userData.username,
			password: userData.password,
			avatarUrl: userData.avatarUrl,           
			enable2FA: userData.enable2FA || false 
		});
		
		console.log('Registration response:', response);
		
		// If 2FA is required, return the setup response (user not created yet)
		if (response.twoFactorSetup) {
			return response; // Return RegistrationResponse with twoFactorSetup
		}
		
		// Normal registration completed (no 2FA)
		console.log('Registration successful!');
		console.log('User ID:', response.id);
		
		// Store tokens and user data (if tokens exist - they might not for 2FA flow)
		if ('accessToken' in response && response.accessToken) {
			localStorage.setItem('authToken', response.accessToken);
			localStorage.setItem('userId', response.id!.toString());
			localStorage.setItem('username', response.username);
		}
		
		// Create AuthResponse with real data from gateway
		const authData: AuthResponse = {
			user: {
				id: response.id!,
				username: response.username,
				avatarUrl: '/images/default-avatar.png',
				onlineStatus: OnlineStatus.ONLINE,
				activityType: 'browsing',
				role: UserRole.USER,
				lastLogin: new Date().toISOString()
			},
			token: (response as any).accessToken || '',
		};

		return authData;
	}

	// Add new method for verifying 2FA registration
	static async verifyRegistration2FA(registrationToken: string, code: string): Promise<AuthResponse> {
		const response = await ApiService.post<RegistrationResponse>('/users/auth/2fa/verify-registration', {
			registrationToken,
			code
		});
		
		console.log('2FA verification successful!');
		console.log('User ID:', response.id);
		console.log('Backup codes:', response.backupCodes);
		
		// User is now created and session is set via cookie
		// We still need to get the access token - but since session is set, 
		// we can call /me or login endpoint to get token
		// Actually, the backend sets session cookie, so we might need to get token separately
		// For now, let's assume we need to login after verification
		
		const authData: AuthResponse = {
			user: {
				id: response.id!,
				username: response.username,
				avatarUrl: '/images/default-avatar.png',
				onlineStatus: OnlineStatus.ONLINE,
				activityType: 'browsing',
				role: UserRole.USER,
				lastLogin: new Date().toISOString()
			},
			token: '', // Will be set after we get it from /me or login
		};
		
		return authData;
	}

	    // ===== REFRESH TOKEN (SINGLE SOURCE OF TRUTH) =====
    static async refreshToken(): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            //console.log('[UserService] Refreshing token...');

            const response = await fetch('/api/v1/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}),
                credentials: 'include'  // ← Sends refreshToken cookie
            });

            if (!response.ok) {
                if (response.status === 401) {
					console.log('[UserService] No valid refresh token (user not logged in)');
				} else {
					console.warn(`[UserService] Token refresh failed: ${response.status}`);
				}
            	throw new Error(`Token refresh failed: ${response.status}`);
            }

            const data = await response.json();

            // Update localStorage with new access token
            localStorage.setItem('authToken', data.accessToken);
            return {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            };

        } catch (error) {
            // If refresh fails, user is logged out
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            throw error;
        }
    }

    // Send logout request & clear local data
    static async logout(): Promise<void> {
        try {
            // Call logout endpoint to invalidate tokens
            await ApiService.post<void>('/api/v1/auth/logout', {});
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Logout error (clearing local data anyway):', error);
        } finally {
            // Clear local storage
            this.clearUserData()
			this.roleCache = null;
            // refreshToken cookie is cleared by server
        }

    }

    // ===== USER DATA (GETTERS) =====
    
    /**
     * Get current user info from gateway (includes role)
     * Now uses ApiService for consistency and auto token refresh
     */
    static async getMe(): Promise<{id: number; username: string; role: string}> {
        try {
            console.log('[UserService] Fetching current user info...');
            
            const userInfo = await ApiService.get<{id: number; username: string; role: string}>('/api/v1/auth/me');
            
            console.log('User info fetched:', userInfo);
            
            // Cache role IN MEMORY with timestamp (not localStorage)
            this.roleCache = {
                role: userInfo.role,
                timestamp: Date.now()
            };
            
            return userInfo;
            
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

		/**
	 * Get current user info from gateway (includes role)
	 */
	static async getCurrentUser(): Promise<PublicUser> {
		try {
			console.log('[UserService] Fetching current user info...');
			
			// Call the /users/me endpoint which should return full user data
			const response = await ApiService.get<any>('/users/me');
			
			console.log('[UserService] Raw response from /users/me:', response);
			
			// Map backend response to PublicUser interface
			const publicUser: PublicUser = {
				id: response.id,
				username: response.username,
				avatarUrl: response.avatarUrl || response.profile?.avatarUrl || 'agent', // ✅ Use avatar ID or default
				onlineStatus: response.onlineStatus || response.profile?.onlineStatus || OnlineStatus.ONLINE,
				activityType: response.activityType || response.profile?.activityType || 'browsing',
				role: this.parseUserRole(response.role),
				lastLogin: response.lastLogin || response.last_login || new Date().toISOString()
			};
			
			console.log('[UserService] Mapped to PublicUser:', publicUser);
			
			// Cache role IN MEMORY with timestamp (not localStorage)
			this.roleCache = {
				role: response.role,
				timestamp: Date.now()
			};
			
			// Update localStorage with full user data
			localStorage.setItem('user', JSON.stringify(publicUser));
			
			return publicUser;
			
		} catch (error) {
			console.error('[UserService] Failed to fetch user info:', error);
			throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

    /**
     * Get user role securely with short-lived cache
     * Always verifies with gateway - NEVER trusts localStorage
     */
    static async getUserRoleSecure(): Promise<string | null> {
        try {
            // Check if cache is valid (less than 1 minute old)
            if (this.roleCache && (Date.now() - this.roleCache.timestamp) < this.CACHE_DURATION) {
                console.log('[UserService] Using cached role (fresh)');
                return this.roleCache.role;
            }

            // Cache expired or doesn't exist - fetch fresh
            console.log('[UserService] Cache expired, fetching fresh role...');
            const userInfo = await this.getMe();
            return userInfo.role;
            
        } catch (error) {
            console.error('Failed to get role:', error);
            return null;
        }
    }

    /**
     * Check if user is guest
     */
    static async isGuest(): Promise<boolean> {
        const role = await this.getUserRoleSecure();
        return role === 'guest';
    }

    /**
     * Check if user is registered user (not guest)
     */
    static async isRegisteredUser(): Promise<boolean> {
        const role = await this.getUserRoleSecure();
        return role === 'user' || role === 'admin';
    }

    // ===== USER UPDATES (SENDERS) =====
    
    // Update current user's profile ON THE BACKEND
    static async updateProfile(updates: ProfileUpdateRequest): Promise<PublicUser> {
        try {
            // Call PATCH endpoint
            const response = await ApiService.patch<any>('/users/me', updates);
            
            console.log('Profile updated successfully:', response);
            
            // Map response to PublicUser
            const user: PublicUser = {
                id: response.id,
                username: response.username,
                avatarUrl: response.profile?.avatarUrl || '/images/default-avatar.png',
                activityType: response.profile?.activityType || updates.activityType,
                onlineStatus: response.profile?.onlineStatus || OnlineStatus.ONLINE,
                role: this.parseUserRole(response.role), 
                lastLogin: response.last_login
            };
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(user));
            
            return user;
            
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    }

  

	// ===== FRIENDS API METHODS =====

	// Get current user's friends list
	// ===== FRIENDS API METHODS =====

// Get current user's friends list
	static async getFriends(): Promise<Friend[]> {
		try {
			const response = await ApiService.get<{ friends: Friend[] }>('/users/friends');
			const friends = response.friends || [];
			
			console.log('[UserService] Friends fetched successfully:', friends);
			console.log(`[UserService] Total friends: ${friends.length}`);
			return friends;
		} catch (error) {
			console.error('[UserService] Failed to fetch friends:', error);
			throw new Error('Failed to load Friends');
		}
	}
	
	// Send friend request
	static async sendFriendRequest(username: string): Promise<{ success: boolean; message: string }> {
		try {
			
			const response = await ApiService.post<{ message: string; friend?: Friend }>('/users/friends', {
				username: username
			});
			
			return {
				success: true,
				message: response.message || 'Friend added successfully'
			};
			
		} catch (error) {
			
			// Extract error message
			let errorMessage = 'Failed to add friend';
			
			if (error instanceof Error) {
				// Check if it's an API error with details
				const apiError = error as any;
				if (apiError.details?.error) {
					errorMessage = apiError.details.error;
				} else if (apiError.message) {
					errorMessage = apiError.message;
				}
			}
			
			return {
				success: false,
				message: errorMessage
			};
		}
	}
  
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

    // Get auth token (accessToken)
    static getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    }

    // Clear all user data (for logout)
    static clearUserData(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('user');
        
        // Clear in-memory cache
        this.roleCache = null;
        
        console.log('User data and role cache cleared');
    }

    // ===== PROFILE & STATISTICS API METHODS =====

    // Get user profile
    static async getUserProfile(userId?: number): Promise<UserProfile> {
        try {
            console.log('[UserService] Fetching user profile...');
            
            // Determine endpoint
            const endpoint = '/users/me'//= userId ? `/users/${userId}` : '/users/me';
            
            // Call the real endpoint through gateway
            const response = await ApiService.get<any>(endpoint);
            
            console.log('Profile fetched successfully:', response);
            
            // Map backend response to UserProfile interface
            const profile: UserProfile = {
                userId: response.id,
                userName: response.username,
                avatarUrl: response.avatarUrl || '/images/default-avatar.png',
                bioText: response.bioText || "No bio yet",
                isOnline: response.isOnline || true,
                lastOnline: response.lastOnline || new Date().toISOString(),
                accountCreationDate: response.accountCreationDate || new Date().toISOString(),
                currentElo: response.currentElo || 1000
            };
            
            return profile;
            
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            throw new Error("Failed to get user Profile")
			
        }
    }

   // Get 1v1 statistics
static async getOneVOneStatistics(userId?: number): Promise<OneVOneStatistics> {
    try {
        console.log('[UserService] Fetching 1v1 statistics...');
        
        // Determine endpoint
        const endpoint = userId ? `/users/${userId}` : '/users/me';
        
        // Call the real endpoint
        const response = await ApiService.get<any>(endpoint);
        
        console.log(' 1v1 Statistics fetched:', response.stats);
        
        // Map backend response to OneVOneStatistics interface
        const totalGames = response.stats?.totalGames || 0;
        const wins = response.stats?.wins || 0;
        
        const stats: OneVOneStatistics = {
            userId: response.id,
            userName: response.username,
            gamesWon: wins,
            gamesLost: response.stats?.losses || 0,
            winPercentage: totalGames > 0 
                ? Math.round((wins / totalGames) * 100) 
                : 0,
            currentWinStreak: response.stats?.currentWinStreak || 0,
            longestWinStreak: response.stats?.bestWinStreak || 0,
            currentRating: response.stats?.currentRating || 1000,
            peakRating: response.stats?.highestRating || 1000
        };
        
        return stats;
        
    } catch (error) {
        console.error('Failed to fetch 1v1 statistics:', error);
        throw new Error(`Failed to load 1v1 statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
	// Get match history
	static async getMatchHistory(userId?: number, limit: number = 20): Promise<MatchHistoryEntry[]> {
		try {
			console.log('[UserService] Fetching match history...');
			
			// Build endpoint
			// If userId provided, fetch that user's history (public view)
			// Otherwise fetch current user's history
			const endpoint = userId ? `/match-history/${userId}` : '/users/me';
			console.log(`[UserService] Calling endpoint: ${endpoint}`);
			
			// Call the real endpoint through gateway
			const response = await ApiService.get<any>(endpoint);
			
			console.log('[UserService] Raw match history response:', response);
			
			// Backend might return array directly or wrapped in object
			const matchesData = Array.isArray(response) ? response : response.matches || response.data || [];
			
			// Map backend response to MatchHistoryEntry interface
			const matches: MatchHistoryEntry[] = matchesData.map((match: any) => ({
				matchId: match.matchId || match.id,
				opponentId: match.opponentId || match.opponent_id,
				opponentName: match.opponentName || match.opponent_name || 'Unknown',
				isWin: match.isWin || match.is_win || match.result === 'win',
				userScore: match.userScore || match.user_score || 0,
				opponentScore: match.opponentScore || match.opponent_score || 0,
				date: match.date || match.played_at || match.created_at || new Date().toISOString(),
				opponentElo: match.opponentElo || match.opponent_elo || 1000,
				eloGained: match.eloGained || match.elo_gained || match.elo_change || 0,
				matchDuration: match.matchDuration || match.duration || match.match_duration
			}));
			
			console.log(`[UserService] Mapped ${matches.length} match history entries`);
			
			// Sort by date (newest first)
			matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			
			return matches;
			
		} catch (error) {
			console.error('[UserService] Failed to fetch match history:', error);
			
			// If endpoint doesn't exist yet, return empty array instead of crashing
			if (error instanceof Error && error.message.includes('404')) {
				console.warn('[UserService] Match history endpoint not implemented yet, returning empty array');
				return [];
			}
			
			throw new Error(`Failed to load match history: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private static parseUserRole(role: string | undefined): UserRole {
        if (!role) return UserRole.USER;
        
        // Normalize to lowercase for comparison
        const normalizedRole = role.toLowerCase();
        
        switch (normalizedRole) {
            case 'admin':
                return UserRole.ADMIN;
            case 'guest':
                return UserRole.GUEST;
            case 'user':
                return UserRole.USER;
            default:
                console.warn(`Unknown role "${role}", defaulting to USER`);
                return UserRole.USER;
        }
    }
}


