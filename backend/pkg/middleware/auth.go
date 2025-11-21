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

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenString string
		var err error

		// Try to get token from cookie first (preferred method)
		tokenString, err = utils.GetAuthCookie(r)
		if err != nil {
			// Fallback to Authorization header for backward compatibility
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.WriteError(w, http.StatusUnauthorized, "Authorization required")
				return
			}

			bearerToken := strings.Split(authHeader, " ")
			if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
				utils.WriteError(w, http.StatusUnauthorized, "Invalid token format")
				return
			}
			tokenString = bearerToken[1]
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Add UserID to context
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// IsSecure returns true if running in production (HTTPS)
func IsSecure() bool {
	env := os.Getenv("ENV")
	return env == "production"
}
