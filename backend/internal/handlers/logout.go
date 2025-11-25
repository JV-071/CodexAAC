package handlers

import (
	"net/http"
	"os"

	"codexaac-backend/pkg/utils"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	isSecure := r.TLS != nil || os.Getenv("ENV") == "production"
	utils.ClearAuthCookie(w, isSecure)

	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

