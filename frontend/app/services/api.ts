import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
    public?: boolean; // Flag to indicate public endpoint (no auth required)
}

class ApiService {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${API_URL}${endpoint}`;
        const isPublic = options.public === true;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Check if token is expired before making request (skip for public endpoints)
        if (!isPublic && authService.isTokenExpired() && authService.isAuthenticated()) {
            authService.removeToken();
            if (typeof window !== 'undefined') {
                window.location.href = '/login?expired=true';
            }
            throw new Error('Session expired. Please login again.');
        }

        // Only add token for protected endpoints
        if (!isPublic) {
            const token = authService.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Remove 'public' from options before passing to fetch
        const { public: _, ...fetchOptions } = options;

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // If unauthorized, clear token and redirect to login (skip for public endpoints)
            // Public endpoints like /login may return 401 for invalid credentials/2FA tokens
            if (response.status === 401 && !isPublic) {
                authService.removeToken();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login?unauthorized=true';
                }
            }
            throw new Error(data.message || 'Request error');
        }

        return data;
    }

    get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

export const api = new ApiService();
