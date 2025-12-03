import { authService, isDevelopment } from './auth';
import { authStateManager } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
    public?: boolean;
}

class ApiService {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${API_URL}${endpoint}`;
        const isPublic = options.public === true;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };


        if (!isPublic && isDevelopment) {
          if (authService.isTokenExpired() && authService.isAuthenticated()) {
            authService.removeToken();
            if (typeof window !== 'undefined') {
              window.location.href = '/login?expired=true';
            }
            throw new Error('Session expired. Please login again.');
          }

          const token = authService.getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const { public: _, ...fetchOptions } = options;

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: 'include',
        });

        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text || 'Request error' };
        }

        if (!response.ok) {
            if (response.status === 503 && data.data?.maintenance === true) {
                if (typeof window !== 'undefined') {
                    if (window.location.pathname !== '/maintenance') {
                        window.location.href = '/maintenance';
                    }
                }
                const error = new Error(data.message || 'Server is under maintenance') as any;
                error.status = response.status;
                throw error;
            }

            if (response.status === 401 && !isPublic) {
                authStateManager.notifyUnauthorized()
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    // Only redirect if not already on login or home page
                    if (currentPath !== '/login' && currentPath !== '/') {
                        window.location.href = '/login?unauthorized=true';
                    }
                }
            }

            const error = new Error(data.message || 'Request error') as any;
            error.status = response.status;
            throw error;
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
