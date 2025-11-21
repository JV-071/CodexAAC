package middleware

import (
	"context"
	"net/http"
	"strings"

	"codexaac-backend/pkg/utils"
)

// CSRFMiddleware validates CSRF tokens for state-changing operations
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context (set by AuthMiddleware)
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		// Get CSRF token from header (X-CSRF-Token) or form field
		var csrfToken string
		
		// Try header first (preferred)
		csrfToken = r.Header.Get("X-CSRF-Token")
		
		// Fallback to form field if header not present
		if csrfToken == "" {
			// Check Content-Type
			contentType := r.Header.Get("Content-Type")
			if strings.HasPrefix(contentType, "application/json") {
				// For JSON, we expect it in a custom header
				// If not in header, try to parse from body (not ideal, but fallback)
				csrfToken = r.Header.Get("X-Csrf-Token") // Alternative header name
			} else {
				// For form data
				csrfToken = r.FormValue("csrf_token")
			}
		}

		if csrfToken == "" {
			utils.WriteError(w, http.StatusForbidden, "CSRF token required")
			return
		}

		// Validate token
		if !utils.ValidateCSRFToken(csrfToken, userID) {
			utils.WriteError(w, http.StatusForbidden, "Invalid CSRF token")
			return
		}

		// Token is valid, continue
		next.ServeHTTP(w, r)
	})
}

// CSRFContextKey is used to store CSRF token in context
type CSRFContextKey string

const CSRFTokenKey CSRFContextKey = "csrfToken"

// GetCSRFTokenFromContext retrieves CSRF token from context
func GetCSRFTokenFromContext(ctx context.Context) (string, bool) {
	token, ok := ctx.Value(CSRFTokenKey).(string)
	return token, ok
}

