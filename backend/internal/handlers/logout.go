package handlers

import (
	"net/http"
	"os"

	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
)

// LogoutHandler handles user logout by clearing the authentication cookie
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context if authenticated (optional - logout can be called without auth)
	if userID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		// Revoke all CSRF tokens for this user
		utils.RevokeAllUserTokens(userID)
	}

	// Clear the authentication cookie
	isSecure := r.TLS != nil || os.Getenv("ENV") == "production"
	utils.ClearAuthCookie(w, isSecure)

	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

