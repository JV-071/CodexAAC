package middleware

import (
	"database/sql"
	"net/http"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok || userID <= 0 {
			utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		ctx, cancel := utils.NewDBContext()
		defer cancel()

		var pageAccess int
		err := database.DB.QueryRowContext(ctx,
			"SELECT page_access FROM accounts WHERE id = ?",
			userID,
		).Scan(&pageAccess)

		if err != nil {
			if err == sql.ErrNoRows {
				utils.WriteError(w, http.StatusNotFound, "Page not found")
				return
			}
			if utils.HandleDBError(w, err) {
				return
			}
			utils.WriteError(w, http.StatusNotFound, "Page not found")
			return
		}

		if pageAccess != 1 {
			utils.WriteError(w, http.StatusNotFound, "Page not found")
			return
		}

		next.ServeHTTP(w, r)
	})
}

