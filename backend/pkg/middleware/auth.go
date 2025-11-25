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

func extractToken(r *http.Request) (string, error) {
	tokenString, err := utils.GetAuthCookie(r)
	if err == nil {
		return tokenString, nil
	}

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

func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString, err := extractToken(r)
		if err == nil {
			if reqWithContext, ok := addUserIDToContext(r, tokenString); ok {
				next.ServeHTTP(w, reqWithContext)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

func IsSecure() bool {
	env := os.Getenv("ENV")
	return env == "production"
}
