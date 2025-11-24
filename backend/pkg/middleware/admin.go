package middleware

import (
	"database/sql"
	"net/http"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

// AdminMiddleware verifies that the authenticated user has admin privileges
// Checks the page_access column in accounts table (1 = admin access, 0 = no access)
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

		// Optimized query: Check directly if user has admin access in a single database call
		// Query uses primary key index (id) for optimal performance
		// Returns only the page_access field to minimize data transfer
		var pageAccess int
		err := database.DB.QueryRowContext(ctx,
			"SELECT page_access FROM accounts WHERE id = ?",
			userID,
		).Scan(&pageAccess)

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

		// Check if page_access is 1 (admin access)
		// Return 404 instead of 403 to hide admin routes from non-admins
		if pageAccess != 1 {
			utils.WriteError(w, http.StatusNotFound, "Page not found")
			return
		}

		// User is admin, proceed with request
		next.ServeHTTP(w, r)
	})
}

