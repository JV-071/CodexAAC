package handlers

import (
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
	"net/http"
)

type RegisterRequest struct {
	Password string `json:"password"`
	Email    string `json:"email"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid data")
		return
	}

	// Basic validation
	if req.Password == "" || req.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	// Sanitize and validate email
	req.Email = utils.SanitizeString(req.Email, 255)
	if !utils.IsValidEmail(req.Email) {
		utils.WriteError(w, http.StatusBadRequest, "Invalid email")
		return
	}

	// Validate password
	if valid, msg := utils.ValidatePassword(req.Password); !valid {
		utils.WriteError(w, http.StatusBadRequest, msg)
		return
	}

	// Create context with timeout for database queries
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Check if account already exists
	var exists bool
	err := database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM accounts WHERE email = ?)", req.Email).Scan(&exists)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking account")
		return
	}

	if exists {
		utils.WriteError(w, http.StatusConflict, "Email already in use")
		return
	}

	// Hash password using SHA1 (compatibility with old Tibia servers)
	hashedPassword := utils.HashSHA1(req.Password)
	
	query := `
		INSERT INTO accounts (name, password, email, creation, premdays, type) 
		VALUES (?, ?, ?, ?, 0, 1)
	`
	
	// Use empty string for name, since login will be by email
	_, err = database.DB.ExecContext(ctx, query, "", hashedPassword, req.Email, time.Now().Unix())
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error creating account")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "Account created successfully")
}
