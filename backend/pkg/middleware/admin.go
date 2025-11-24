package middleware

import (
	"database/sql"
	"net/http"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

// GetAdminSecretValue returns the admin secret value from environment variable
// Falls back to "5" if ADMIN_SECRET is not set (for backward compatibility)
func GetAdminSecretValue() string {
	secret := os.Getenv("ADMIN_SECRET")
	if secret == "" {
		return "5" // Default fallback for backward compatibility
	}
	return secret
}

// AdminMiddleware verifies that the authenticated user has admin privileges
// Admin secret value is read from ADMIN_SECRET environment variable (defaults to "5" if not set)
// Must be used after AuthMiddleware
// Optimized: Uses a single query with direct comparison to minimize database round-trips
// Security: Returns 404 instead of 403 to hide admin routes from non-admins
func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context (set by AuthMiddleware)
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok || userID <= 0 {
			utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		ctx, cancel := utils.NewDBContext()
		defer cancel()

		// Optimized query: Check directly if user is admin in a single database call
		// Query uses primary key index (id) for optimal performance
		// Returns only the secret field to minimize data transfer
		var secret sql.NullString
		err := database.DB.QueryRowContext(ctx,
			"SELECT secret FROM accounts WHERE id = ?",
			userID,
		).Scan(&secret)

		if err != nil {
			if err == sql.ErrNoRows {
				// Account doesn't exist - return 404 to hide admin routes
				utils.WriteError(w, http.StatusNotFound, "Page not found")
				return
			}
			// Handle database errors (timeout, connection issues, etc.)
			if utils.HandleDBError(w, err) {
				return
			}
			// For any other error, return 404 to hide admin routes
			utils.WriteError(w, http.StatusNotFound, "Page not found")
			return
		}

		// Check if secret equals admin value
		// Return 404 instead of 403 to hide admin routes from non-admins
		adminSecret := GetAdminSecretValue()
		if !secret.Valid || secret.String != adminSecret {
			utils.WriteError(w, http.StatusNotFound, "Page not found")
			return
		}

		// User is admin, proceed with request
		next.ServeHTTP(w, r)
	})
}

