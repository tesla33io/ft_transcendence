export class ApiService {
    static readonly BASE_URL = 'http://localhost:3000'

    private static getAuthHeaders(): Record<string, string> {
        const token = localStorage.getItem('authToken');  // ← Get the accessToken
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;  // ← Add Bearer token
            console.log('📨 [API] Sending Authorization header:', headers['Authorization'].substring(0, 30) + '...');
        } else {
            console.warn('⚠️ [API] No auth token found in localStorage');
        }
        
        return headers;
    }

    // Generic GET request with auto-auth
    static async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
            credentials: 'include'  // ← Send cookies (refreshToken)
        });
        
        if (response.status === 401) {
            // Token expired, try refresh
            await this.refreshAccessToken();
            // Retry request
            return this.get(endpoint);
        }
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    }

    // Generic POST request with auto-auth
    static async post<T>(endpoint: string, data: any): Promise<T> {
        const fullUrl = `${this.BASE_URL}${endpoint}`;
        console.log("POST request to:", fullUrl)
        
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                credentials: 'include',  // ← Send cookies (refreshToken)
                body: JSON.stringify(data)
            });

            console.log("Response status:", response.status);
            
            if (response.status === 401) {
                // Token expired, try refresh
                console.warn('⚠️ [API] Got 401, attempting token refresh...');
                await this.refreshAccessToken();
                // Retry request
                return this.post(endpoint, data);
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [API] Error response:', errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            
            return response.json();
        } catch (error) {
            console.error("❌ [API] Fetch error:", error);
            throw error;
        }
    }

    // Refresh access token using httpOnly cookie
    private static async refreshAccessToken(): Promise<void> {
        try {
            console.log('🔄 [API] Refreshing access token...');
            const response = await fetch(`${this.BASE_URL}/users/auth/refresh`, {
                method: 'POST',
                credentials: 'include'  // ← Send refreshToken cookie
            });

            if (response.ok) {
                const { accessToken } = await response.json();
                localStorage.setItem('authToken', accessToken);
                console.log('✅ [API] Access token refreshed successfully');
            } else {
                // Refresh failed, user must login again
                console.error('❌ [API] Token refresh failed');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('❌ [API] Token refresh error:', error);
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
    }
}