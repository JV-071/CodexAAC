// Centralized authentication service
// Handles token management with httpOnly cookies (production) or localStorage (development)

const TOKEN_KEY = 'token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Check if we're in development (different ports = can't use cookies)
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const authService = {
  // Save token (localStorage in dev, cookie in production via backend)
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      // In development, store in localStorage as fallback
      // In production, token is stored in httpOnly cookie by backend
      if (isDevelopment) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
  },

  // Get token from localStorage (development only)
  getToken(): string | null {
    if (typeof window !== 'undefined' && isDevelopment) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null; // In production, token is in httpOnly cookie
  },

  // Remove token (localStorage in dev, cookie cleared by backend in production)
  removeToken(): void {
    if (typeof window !== 'undefined' && isDevelopment) {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (isDevelopment) {
      return this.getToken() !== null;
    }
    // In production, assume authenticated if cookie exists (validated by backend)
    return true;
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    if (isDevelopment) {
      const token = this.getToken();
      if (!token) return true;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        return Date.now() >= exp;
      } catch {
        return true;
      }
    }
    // In production, backend validates cookie expiration
    return false;
  },

  // Logout - clears token/cookie and redirects
  async logout(redirectTo: string = '/login'): Promise<void> {
    try {
      // Call backend logout endpoint to clear httpOnly cookie (production)
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // Even if logout fails, continue
    } finally {
      // Clear localStorage token (development)
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  },
};

