package handlers

import (
	"net/http"

	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
)

// GetCSRFTokenHandler generates and returns a CSRF token for the authenticated user
func GetCSRFTokenHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Generate CSRF token
	token, err := utils.GenerateCSRFToken(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error generating CSRF token")
		return
	}

	// Return token
	utils.WriteJSON(w, http.StatusOK, map[string]string{
		"csrfToken": token,
	})
}

