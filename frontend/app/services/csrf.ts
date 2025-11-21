// CSRF token management service
// Handles CSRF token retrieval and storage

const CSRF_TOKEN_KEY = 'csrf_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const csrfService = {
  // Get CSRF token from backend
  async getToken(): Promise<string | null> {
    try {
      const response = await fetch(`${API_URL}/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const token = data.csrfToken;

      // Store token in memory (not localStorage - for security)
      if (typeof window !== 'undefined') {
        // Store in sessionStorage (cleared on tab close) or memory
        sessionStorage.setItem(CSRF_TOKEN_KEY, token);
      }

      return token;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  },

  // Get stored CSRF token
  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(CSRF_TOKEN_KEY);
    }
    return null;
  },

  // Clear CSRF token
  clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
    }
  },

  // Get or fetch CSRF token (with caching)
  async getOrFetchToken(): Promise<string | null> {
    // Try to get stored token first
    const stored = this.getStoredToken();
    if (stored) {
      return stored;
    }

    // If no stored token, fetch new one
    return await this.getToken();
  },
};

