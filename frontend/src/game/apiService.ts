export class ApiService {
    private static getAuthHeaders(): Record<string, string> {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Generic GET request with auto-auth
    static async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`/api${endpoint}`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    }

    // Generic POST request with auto-auth
    static async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    }
}