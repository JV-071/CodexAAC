package middleware

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

// MaintenanceMiddleware checks if maintenance mode is enabled and redirects non-admin users
// Admin users and API health endpoints are exempt from maintenance mode
func MaintenanceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow health check, maintenance page, and API endpoints that don't need maintenance check
		path := r.URL.Path
		if path == "/api/health" || path == "/api" || path == "/maintenance" || 
		   path == "/api/maintenance/status" || strings.HasPrefix(path, "/api/admin") {
			next.ServeHTTP(w, r)
			return
		}

		ctx, cancel := utils.NewDBContext()
		defer cancel()

		var enabled bool
		var message sql.NullString
		err := database.DB.QueryRowContext(ctx,
			"SELECT enabled, message FROM maintenance WHERE id = 1",
		).Scan(&enabled, &message)

		// If no record exists or error, assume maintenance is off
		if err != nil {
			if err != sql.ErrNoRows {
				// Log error but don't block requests
				utils.HandleDBError(w, err)
			}
			next.ServeHTTP(w, r)
			return
		}

		// If maintenance is enabled, check if user is admin
		if enabled {
			// Check if user is admin (bypass maintenance)
			// Only check if user is authenticated (has UserIDKey in context)
			userID, ok := r.Context().Value(UserIDKey).(int)
			if ok && userID > 0 {
				// Reuse same context for admin check (optimized: single context for both queries)
				var secret sql.NullString
				err := database.DB.QueryRowContext(ctx,
					"SELECT secret FROM accounts WHERE id = ?",
					userID,
				).Scan(&secret)

				// If user is admin, allow access
				adminSecret := GetAdminSecretValue()
				if err == nil && secret.Valid && secret.String == adminSecret {
					next.ServeHTTP(w, r)
					return
				}
			}

			// For API requests, return JSON response
			if strings.HasPrefix(path, "/api/") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)

				response := map[string]interface{}{
					"success": false,
					"message": "Server is under maintenance",
					"data": map[string]interface{}{
						"maintenance": true,
						"message":     message.String,
					},
				}

				json.NewEncoder(w).Encode(response)
				return
			}

			// For frontend routes, redirect to maintenance page
			http.Redirect(w, r, "/maintenance", http.StatusTemporaryRedirect)
			return
		}

		// Maintenance is off, proceed normally
		next.ServeHTTP(w, r)
	})
}

