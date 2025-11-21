package handlers

import (
	"net/http"
	"os"

	"codexaac-backend/pkg/utils"
)

// LogoutHandler handles user logout by clearing the authentication cookie
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Clear the authentication cookie
	isSecure := r.TLS != nil || os.Getenv("ENV") == "production"
	utils.ClearAuthCookie(w, isSecure)

	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

