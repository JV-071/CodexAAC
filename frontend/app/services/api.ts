import { authService } from './auth';
import { csrfService } from './csrf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
    public?: boolean; // Flag to indicate public endpoint (no auth required)
    skipCSRF?: boolean; // Flag to skip CSRF token (for read-only operations)
}

class ApiService {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${API_URL}${endpoint}`;
        const isPublic = options.public === true;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Check if we're in development (different ports = use Authorization header)
        // In production (same domain), use httpOnly cookies
        const isDevelopment = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        // In development, check token expiration and add Authorization header
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
        // In production, token is in httpOnly cookie (automatically sent)

        // Add CSRF token for state-changing operations (POST, PUT, DELETE)
        // Skip if explicitly requested or if it's a public endpoint
        const skipCSRF = options.skipCSRF === true || isPublic;
        const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
          (options.method || 'GET').toUpperCase()
        );

        if (!skipCSRF && isStateChanging && !isPublic) {
          const csrfToken = await csrfService.getOrFetchToken();
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
          }
        }

        // Remove custom options before passing to fetch
        const { public: _, skipCSRF: __, ...fetchOptions } = options;

        // Include credentials (cookies) in all requests
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: 'include', // Important: sends httpOnly cookies
        });

        // Try to parse JSON, but handle non-JSON responses (like 401 errors)
        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, read as text
            const text = await response.text();
            data = { message: text || 'Request error' };
        }

        if (!response.ok) {
            // If CSRF token is invalid, try to get a new one and retry once
            if (response.status === 403 && data.message && data.message.includes('CSRF')) {
                // Clear invalid token
                csrfService.clearToken();
                // Try to get new token and retry (only once to avoid infinite loop)
                const newToken = await csrfService.getToken();
                if (newToken && isStateChanging && !skipCSRF) {
                    headers['X-CSRF-Token'] = newToken;
                    // Retry the request once
                    const retryResponse = await fetch(url, {
                        ...fetchOptions,
                        headers,
                        credentials: 'include',
                    });
                    if (retryResponse.ok) {
                        const retryContentType = retryResponse.headers.get('content-type');
                        if (retryContentType && retryContentType.includes('application/json')) {
                            return await retryResponse.json() as T;
                        }
                        const retryText = await retryResponse.text();
                        return { message: retryText || 'Request error' } as T;
                    }
                }
            }

            // If unauthorized, redirect to login (skip for public endpoints)
            // Public endpoints like /login may return 401 for invalid credentials/2FA tokens
            // Cookie will be cleared by backend on logout
            if (response.status === 401 && !isPublic) {
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
