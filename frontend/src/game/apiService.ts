export class ApiService {
	static readonly BASE_URL = 'http://localhost:3000'

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
        const fullUrl = `${this.BASE_URL}${endpoint}`;
        console.log("POST request to:", fullUrl)
        
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            });

        console.log("Response status:", response.status);  // ← ADD THIS
        console.log("Response headers:", response.headers);  // ← ADD THIS
        
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }
}