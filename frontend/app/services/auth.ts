// Centralized authentication service
// Handles token management with httpOnly cookies (production) or localStorage (development)

const TOKEN_KEY = 'token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Check if we're in development (different ports = can't use cookies)
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const authService = {
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      if (isDevelopment) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined' && isDevelopment) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null
  },

  removeToken(): void {
    if (typeof window !== 'undefined' && isDevelopment) {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  isAuthenticated(): boolean {
    if (isDevelopment) {
      const token = this.getToken();
      if (!token) return false;
      return !this.isTokenExpired();
    }
    return true
  },

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
    return false;
  },

  async logout(redirectTo: string = '/login'): Promise<void> {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
    } finally {
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  },
};

