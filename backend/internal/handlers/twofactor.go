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

func Enable2FAHandler(w http.ResponseWriter, r *http.Request) {
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

	if len(req.Password) > 128 {
		utils.WriteError(w, http.StatusBadRequest, "Password too long")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

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

	hashedPassword := utils.HashSHA1(req.Password)
	if storedPassword != hashedPassword {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid password")
		return
	}

	if existingSecret.Valid && existingSecret.String != "" {
		utils.WriteError(w, http.StatusBadRequest, "Two-factor authentication is already enabled. Disable it first to enable a new one.")
		return
	}

	secret, err := twofactor.GenerateSecret()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate 2FA secret")
		return
	}

	var email string
	err = database.DB.QueryRowContext(ctx, "SELECT email FROM accounts WHERE id = ?", userID).Scan(&email)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	serverName := os.Getenv("SERVER_NAME")
	if serverName == "" {
		serverName = "CodexAAC"
	}

	qrCodeBase64, err := twofactor.GenerateQRCodeBase64(secret, email, serverName)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to generate QR code")
		return
	}

	otpauthURL := twofactor.GenerateOTPAuthURL(secret, email, serverName)

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

	if len(req.Token) > 6 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid 2FA token format")
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

	if !secret.Valid || secret.String == "" {
		utils.WriteError(w, http.StatusBadRequest, "2FA is not enabled. Please enable it first.")
		return
	}

	if !twofactor.ValidateToken(secret.String, req.Token) {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid 2FA token")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Two-factor authentication has been successfully enabled.", nil)
}

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

	hashedPassword := utils.HashSHA1(req.Password)
	if storedPassword != hashedPassword {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid password")
		return
	}

	if !secret.Valid || secret.String == "" {
		utils.WriteError(w, http.StatusBadRequest, "Two-factor authentication is not enabled")
		return
	}

	if !twofactor.ValidateToken(secret.String, req.Token) {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid 2FA token")
		return
	}

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

