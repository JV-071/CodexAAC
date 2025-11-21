package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/twofactor"
	"codexaac-backend/pkg/utils"
)

type Enable2FARequest struct {
	Password string `json:"password"` // Password confirmation required
}

type Enable2FAResponse struct {
	Secret    string `json:"secret"`     // The secret key (for manual entry)
	QRCode    string `json:"qrCode"`     // Base64 encoded QR code image
	OTPAuthURL string `json:"otpauthUrl"` // otpauth:// URL for manual entry
	Message   string `json:"message"`
}

type Verify2FARequest struct {
	Token string `json:"token"` // 2FA token to verify
}

type Disable2FARequest struct {
	Password string `json:"password"` // Password confirmation required
	Token    string `json:"token"`    // 2FA token confirmation required
}

// Enable2FAHandler generates a new 2FA secret and QR code for the authenticated user
func Enable2FAHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req Enable2FARequest
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

	// Validate password length
	if len(req.Password) > 128 {
		utils.WriteError(w, http.StatusBadRequest, "Password too long")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Verify password and check if 2FA is already enabled
	var storedPassword string
	var existingSecret sql.NullString
	err := database.DB.QueryRowContext(ctx, "SELECT password, COALESCE(secret, '') FROM accounts WHERE id = ?", userID).Scan(&storedPassword, &existingSecret)
	
	if err == sql.ErrNoRows {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	} else if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Verify password
	hashedPassword := utils.HashSHA1(req.Password)
	if storedPassword != hashedPassword {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid password")
		return
	}

	// Check if 2FA is already enabled
	if existingSecret.Valid && existingSecret.String != "" {
		utils.WriteError(w, http.StatusBadRequest, "Two-factor authentication is already enabled. Disable it first to enable a new one.")
		return
	}

	// Generate new secret
	secret, err := twofactor.GenerateSecret()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate 2FA secret")
		return
	}

	// Get account email for QR code
	var email string
	err = database.DB.QueryRowContext(ctx, "SELECT email FROM accounts WHERE id = ?", userID).Scan(&email)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Get server name from environment (default to "CodexAAC")
	serverName := os.Getenv("SERVER_NAME")
	if serverName == "" {
		serverName = "CodexAAC"
	}

	// Generate QR code
	qrCodeBase64, err := twofactor.GenerateQRCodeBase64(secret, email, serverName)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate QR code")
		return
	}

	// Generate otpauth URL
	otpauthURL := twofactor.GenerateOTPAuthURL(secret, email, serverName)

	// Store secret in database (but don't mark as enabled yet - user needs to verify first)
	_, err = database.DB.ExecContext(ctx, "UPDATE accounts SET secret = ? WHERE id = ?", secret, userID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save 2FA secret")
		return
	}

	utils.WriteJSON(w, http.StatusOK, Enable2FAResponse{
		Secret:     secret,
		QRCode:     qrCodeBase64,
		OTPAuthURL: otpauthURL,
		Message:    "Scan the QR code with your authenticator app, then verify with a token to complete setup.",
	})
}

// Verify2FAHandler verifies a 2FA token to complete the setup
func Verify2FAHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req Verify2FARequest
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

	// Validate token length
	if len(req.Token) > 6 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid 2FA token format")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Get secret from database
	var secret sql.NullString
	err := database.DB.QueryRowContext(ctx, "SELECT COALESCE(secret, '') FROM accounts WHERE id = ?", userID).Scan(&secret)
	
	if err == sql.ErrNoRows {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	} else if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if !secret.Valid || secret.String == "" {
		utils.WriteError(w, http.StatusBadRequest, "2FA is not enabled. Please enable it first.")
		return
	}

	// Validate token
	if !twofactor.ValidateToken(secret.String, req.Token) {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid 2FA token")
		return
	}

	// Token is valid - 2FA is now fully enabled
	utils.WriteSuccess(w, http.StatusOK, "Two-factor authentication has been successfully enabled.", nil)
}

// Disable2FAHandler disables 2FA for the authenticated user
func Disable2FAHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req Disable2FARequest
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

	// Validate inputs
	if len(req.Password) > 128 {
		utils.WriteError(w, http.StatusBadRequest, "Password too long")
		return
	}
	if len(req.Token) > 6 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid 2FA token format")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Verify password and get secret
	var storedPassword string
	var secret sql.NullString
	err := database.DB.QueryRowContext(ctx, "SELECT password, COALESCE(secret, '') FROM accounts WHERE id = ?", userID).Scan(&storedPassword, &secret)
	
	if err == sql.ErrNoRows {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	} else if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Verify password
	hashedPassword := utils.HashSHA1(req.Password)
	if storedPassword != hashedPassword {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid password")
		return
	}

	// Check if 2FA is enabled
	if !secret.Valid || secret.String == "" {
		utils.WriteError(w, http.StatusBadRequest, "Two-factor authentication is not enabled")
		return
	}

	// Verify 2FA token
	if !twofactor.ValidateToken(secret.String, req.Token) {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid 2FA token")
		return
	}

	// Remove secret from database
	_, err = database.DB.ExecContext(ctx, "UPDATE accounts SET secret = NULL WHERE id = ?", userID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to disable 2FA")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Two-factor authentication has been successfully disabled.", nil)
}

// Get2FAStatusHandler returns the 2FA status for the authenticated user
func Get2FAStatusHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var secret sql.NullString
	err := database.DB.QueryRowContext(ctx, "SELECT COALESCE(secret, '') FROM accounts WHERE id = ?", userID).Scan(&secret)
	
	if err == sql.ErrNoRows {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	} else if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	enabled := secret.Valid && secret.String != ""
	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"enabled": enabled,
	})
}

