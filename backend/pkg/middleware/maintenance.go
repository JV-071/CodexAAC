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
		path := r.URL.Path
		if path == "/api/health" || path == "/api" || path == "/maintenance" || 
		   path == "/api/maintenance/status" || path == "/login.php" || path == "/login" ||
		   strings.HasPrefix(path, "/api/admin") {
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

		if err != nil {
			if err != sql.ErrNoRows {
				utils.HandleDBError(w, err)
			}
			next.ServeHTTP(w, r)
			return
		}

		if enabled {
			userID, ok := r.Context().Value(UserIDKey).(int)
			if ok && userID > 0 {
				var pageAccess int
				err := database.DB.QueryRowContext(ctx,
					"SELECT page_access FROM accounts WHERE id = ?",
					userID,
				).Scan(&pageAccess)

				if err == nil && pageAccess == 1 {
					next.ServeHTTP(w, r)
					return
				}
			}

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

			http.Redirect(w, r, "/maintenance", http.StatusTemporaryRedirect)
			return
		}

		next.ServeHTTP(w, r)
	})
}

