package handlers

import (
	"database/sql"
	"net/http"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/auth"
	"codexaac-backend/pkg/utils"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	// Validate email
	req.Email = utils.SanitizeString(req.Email, 255)
	if !utils.IsValidEmail(req.Email) {
		utils.WriteError(w, http.StatusBadRequest, "Invalid email")
		return
	}

	// Validate password length
	if len(req.Password) > 128 {
		utils.WriteError(w, http.StatusBadRequest, "Password too long")
		return
	}

	// ALWAYS calculate password hash to prevent timing attacks
	// This ensures response time is constant regardless of whether user exists
	hashedPassword := utils.HashSHA1(req.Password)

	// Create context with timeout for database query
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Query user from database with timeout
	var storedPassword string
	var userID int
	err := database.DB.QueryRowContext(ctx, "SELECT id, password FROM accounts WHERE email = ?", req.Email).Scan(&userID, &storedPassword)
	
	// Use a variable to control if login is valid
	loginValid := false
	
	if err == sql.ErrNoRows {
		// User doesn't exist - but we already calculated hash above (constant time)
		loginValid = false
	} else if err != nil {
		// Handle database errors (timeout, etc)
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	} else {
		// User exists - compare hash
		loginValid = (storedPassword == hashedPassword)
	}

	// Return the same generic message regardless of failure reason
	if !loginValid {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Successful login - generate token
	token, err := auth.GenerateToken(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error generating token")
		return
	}

	utils.WriteJSON(w, http.StatusOK, LoginResponse{Token: token})
}
