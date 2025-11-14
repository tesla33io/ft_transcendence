import { UserService } from './userService';
import { Router } from '../router';

export class AuthService {
    /**
     * Check if user is authenticated and auto-login if possible
     * Called on app startup (main.ts)
     */
    static async checkAuth(router: Router): Promise<boolean> {
        // console.log('[AuthService] Checking authentication status...');

        // Step 1: Check if we have an access token
        const accessToken = localStorage.getItem('authToken');

        if (accessToken) {
            // console.log('[AuthService] Access token found in localStorage');

            // Try to verify it's still valid
            const isValid = await this.verifyAccessToken();

            if (isValid) {
                // console.log('[AuthService] Access token is valid - auto-login');
                return true;
            }

            // console.log('[AuthService] Access token expired - trying refresh');
        } else {
            console.log('[AuthService] No access token found');
        }

        // Step 2: Try to refresh the token
        const refreshed = await this.tryRefreshToken();

        if (refreshed) {
            // console.log('[AuthService] Token refreshed - auto-login');
            return true;
        }

        // console.log('[AuthService] No valid tokens - user must login');
        return false;
    }

    /**
     * Verify if current access token is valid
     */
    private static async verifyAccessToken(): Promise<boolean> {
        try {
            // Call /me endpoint to verify token
            const userInfo = await UserService.getMe();

            if (userInfo && userInfo.id) {
                // console.log(`[AuthService] Token valid for user: ${userInfo.username}`);
                return true;
            }

            return false;

        } catch (error) {
            // console.log('[AuthService] Token verification failed:', error);
            return false;
        }
    }

    /**
     * Try to refresh the access token using refresh token cookie
     */
    private static async tryRefreshToken(): Promise<boolean> {
        try {
            //console.log('[AuthService] Attempting token refresh...');

            // Call refresh endpoint
            await UserService.refreshToken();

            // console.log('[AuthService] Token refresh successful');
            return true;

        } catch (error) {
            // console.log('[AuthService] Token refresh failed');

            // Clear invalid tokens
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');

            return false;
        }
    }

    /**
     * Get the appropriate landing page based on user role
     */
    static async getLandingPage(): Promise<string> {
        try {
            const role = await UserService.getUserRoleSecure();
            console.log("ROLE",role)
            if (role === 'guest') {
                return '/guest';
            } else if (role === 'user' || role === 'admin') {
                return '/desktop';
            }

            return '/login';

        } catch (error) {
            console.error('Error getting landing page:', error);
            return '/login';
        }
    }
}
