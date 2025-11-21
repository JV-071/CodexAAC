package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/auth"
	"codexaac-backend/pkg/twofactor"
	"codexaac-backend/pkg/utils"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Token    string `json:"token,omitempty"` // 2FA token (required if account has 2FA enabled)
}

type LoginResponse struct {
	Token        string `json:"token,omitempty"`        // JWT token (for development - localStorage)
	Requires2FA  bool   `json:"requires2FA,omitempty"`  // True if 2FA token is required
	Message      string `json:"message,omitempty"`      // Message for the user
	// Note: Token is sent via httpOnly cookie in production, and in JSON for development (different ports)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		if errors.Is(err, utils.ErrBodyTooLarge) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
		} else if errors.Is(err, utils.ErrInvalidContentType) {
			utils.WriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid request")
		}
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

	// Query user from database with timeout (including 2FA secret)
	var storedPassword string
	var userID int
	var secret sql.NullString
	err := database.DB.QueryRowContext(ctx, "SELECT id, password, COALESCE(secret, '') FROM accounts WHERE email = ?", req.Email).Scan(&userID, &storedPassword, &secret)
	
	// Use a variable to control if login is valid
	loginValid := false
	has2FA := false
	var twoFactorSecret string
	
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
		
		// Check if 2FA is enabled
		if secret.Valid && secret.String != "" {
			has2FA = true
			twoFactorSecret = secret.String
		}
	}

	// Return the same generic message regardless of failure reason
	if !loginValid {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// If 2FA is enabled, validate token
	if has2FA {
		// Validate 2FA token length
		if len(req.Token) > 6 {
			utils.WriteError(w, http.StatusBadRequest, "Invalid 2FA token format")
			return
		}

		// If no token provided, request it
		if req.Token == "" {
			utils.WriteJSON(w, http.StatusOK, LoginResponse{
				Requires2FA: true,
				Message:     "Two-factor authentication required. Please enter your 2FA token.",
			})
			return
		}

		// Validate 2FA token
		if !twofactor.ValidateToken(twoFactorSecret, req.Token) {
			utils.WriteError(w, http.StatusUnauthorized, "Invalid 2FA token")
			return
		}
	}

	// Successful login - generate JWT token
	jwtToken, err := auth.GenerateToken(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error generating token")
		return
	}

	// Set token in httpOnly cookie (production) and also return in JSON (development)
	// In development, frontend and backend are on different ports, so cookies don't work
	// In production, both use same domain, so httpOnly cookie works
	isSecure := r.TLS != nil || os.Getenv("ENV") == "production"
	utils.SetAuthCookie(w, jwtToken, isSecure)

	// Return token in JSON for development (different ports), cookie for production
	utils.WriteJSON(w, http.StatusOK, LoginResponse{
		Token:   jwtToken, // Include token for development (localStorage)
		Message: "Login successful",
	})
}
