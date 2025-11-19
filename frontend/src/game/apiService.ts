export class ApiService {
    static readonly BASE_URL = ``

    private static getAuthHeaders(): Record<string, string> {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Generic GET request with auto-auth & 401 handling
    static async get<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });

            console.log(`[API] GET ${endpoint} - Status: ${response.status}`);

            if (response.status === 401) {
                // Token expired, trigger refresh
                const { UserService } = await import('./userService');
                console.log('[API] 401 Unauthorized - Attempting refresh...');

                try {
                    await UserService.refreshToken();
                    // Retry with new token
                    return this.get<T>(endpoint);
                } catch (refreshError) {
                    console.error('[API] Refresh failed, logging out');
                    localStorage.clear();
                    window.location.href = '/login';
                    throw refreshError;
                }
            }

            // Check content type to ensure we're getting JSON
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            console.log("respone ok ", response.ok )
			console.log("RESPONSE",response)
            if (!response.ok) {
                const text = await response.text();
                let details: any;
                // Only try to parse as JSON if content type indicates JSON
                if (isJson) {
                    try { details = text ? JSON.parse(text) : null; } catch (_) {}
                }
				else{
					let jason = JSON.stringify(text)
					try { details = text ? JSON.parse(jason) : null; } catch (_) {}
				}
                const message = details?.error ?? details?.message ?? (isJson ? text : 'Server returned non-JSON response');
                const error: any = new Error(`API Error ${response.status}: ${message}`);
                error.status = response.status;
                error.details = details;
                throw error;
            }

            // If response is not JSON, throw an error
            if (!isJson) {

                const text = await response.text();
                const error: any = new Error(`API Error: Expected JSON but got ${contentType || 'unknown content type'}`);
                error.status = response.status;
                error.responseText = text.substring(0, 200); // First 200 chars for debugging
                throw error;
            }

            return response.json();
        } catch (error) {
            console.error('[API] GET error:', error);
            throw error;
        }
    }

	// Generic PATCH request with auto-auth & 401 handling
	static async patch<T>(endpoint: string, data: any): Promise<T> {
		try {
			const response = await fetch(`${this.BASE_URL}${endpoint}`, {
				method: 'PATCH',
				headers: this.getAuthHeaders(),
				credentials: 'include',
				body: JSON.stringify(data)
			});

			//console.log(`[API] PATCH ${endpoint} - Status: ${response.status}`);

			if (response.status === 401) {
				// Token expired, trigger refresh
				const { UserService } = await import('./userService');
				//console.log('[API] 401 Unauthorized - Attempting refresh...');

				try {
					await UserService.refreshToken();
					// Retry with new token
					return this.patch<T>(endpoint, data);
				} catch (refreshError) {
					//console.error('[API] Refresh failed, logging out');
					localStorage.clear();
					window.location.href = '/login';
					throw refreshError;
				}
			}

			if (!response.ok) {
				const error: any = new Error(`${response.status}`);
				error.status = response.status;
				throw error;
			}

			return response.json();
		} catch (error) {
			//console.error('[API] PATCH error:', error);
			throw error;
		}
	}

    // Generic POST request with auto-auth & 401 handling
    static async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(data)
            });

            //console.log(`[API] POST ${endpoint} - Status: ${response.status}`);

            if (response.status === 401) {
                // Token expired, trigger refresh
                if (endpoint === '/users/auth/login'){
                    const error: any = new Error('Unauthorized: Invalid credentials');
                    error.status = 401;
                    throw error;
                }
                const { UserService } = await import('./userService');
                //console.log('[API] 401 Unauthorized - Attempting refresh...');

                try {
                    await UserService.refreshToken();
                    // Retry with new token
                    return this.post<T>(endpoint, data);
                } catch (refreshError) {
                    //console.error('[API] Refresh failed, logging out');
                    localStorage.clear();
                    window.location.href = '/login';
                    throw refreshError;
                }
            }

            if (!response.ok) {
                const text = await response.text();
                let details: any;
                try { details = text ? JSON.parse(text) : null; } catch (_) {}
                const message = details?.error ?? details?.message ?? text ?? response.statusText;
                const error: any = new Error(`${response.status}: ${message}`);
                error.status = response.status;
                error.details = details;
                throw error;
            }

            return response.json();
        } catch (error) {
            //console.error('[API] POST error:', error);
            throw error;
        }
    }
}
