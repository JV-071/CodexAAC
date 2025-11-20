// Centralized authentication service
// Handles token storage, retrieval, and cleanup

const TOKEN_KEY = 'token';

export const authService = {
  // Save token to localStorage
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Get token from localStorage
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Remove token from localStorage (logout)
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },

  // Check if token is expired (basic check - JWT should be validated on backend)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      // If token is malformed, consider it expired
      return true;
    }
  },

  // Logout - clears token and redirects
  logout(redirectTo: string = '/login'): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
};

