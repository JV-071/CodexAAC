package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"codexaac-backend/pkg/auth"
	"codexaac-backend/pkg/utils"
)

type contextKey string

const UserIDKey contextKey = "userID"

// extractToken extracts the authentication token from cookie or Authorization header
// Priority: httpOnly cookie (production) > Authorization header (development)
// In development, frontend uses Authorization header because cookies don't work across different ports
func extractToken(r *http.Request) (string, error) {
	// Try to get token from httpOnly cookie first (preferred method for production)
	tokenString, err := utils.GetAuthCookie(r)
	if err == nil {
		return tokenString, nil
	}

	// Fallback to Authorization header (used in development when frontend/backend are on different ports)
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", err
	}

	bearerToken := strings.Split(authHeader, " ")
	if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
		return "", err
	}

	return bearerToken[1], nil
}

// addUserIDToContext adds UserID to request context if token is valid
func addUserIDToContext(r *http.Request, tokenString string) (*http.Request, bool) {
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		return r, false
	}

	ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
	return r.WithContext(ctx), true
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString, err := extractToken(r)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, "Authorization required")
			return
		}

		reqWithContext, ok := addUserIDToContext(r, tokenString)
		if !ok {
			utils.WriteError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		next.ServeHTTP(w, reqWithContext)
	})
}

// OptionalAuthMiddleware is like AuthMiddleware but doesn't return error if token is missing
// It only adds UserID to context if a valid token is present
func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString, err := extractToken(r)
		if err == nil {
			// If we have a token, try to validate it and add to context
			if reqWithContext, ok := addUserIDToContext(r, tokenString); ok {
				next.ServeHTTP(w, reqWithContext)
				return
			}
		}

		// No valid token, proceed without UserID in context
		next.ServeHTTP(w, r)
	})
}

// IsSecure returns true if running in production (HTTPS)
func IsSecure() bool {
	env := os.Getenv("ENV")
	return env == "production"
}
