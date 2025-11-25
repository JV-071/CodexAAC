package handlers

import (
	"errors"
	"net/http"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

type RegisterRequest struct {
	Password string `json:"password"`
	Email    string `json:"email"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		if errors.Is(err, utils.ErrBodyTooLarge) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
		} else if errors.Is(err, utils.ErrInvalidContentType) {
			utils.WriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid data")
		}
		return
	}

	if req.Password == "" || req.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	req.Email = utils.SanitizeString(req.Email, 255)
	if !utils.IsValidEmail(req.Email) {
		utils.WriteError(w, http.StatusBadRequest, "Invalid email")
		return
	}

	if valid, msg := utils.ValidatePassword(req.Password); !valid {
		utils.WriteError(w, http.StatusBadRequest, msg)
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

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

	hashedPassword := utils.HashSHA1(req.Password)
	
	query := `
		INSERT INTO accounts (name, password, email, creation, premdays, type) 
		VALUES (?, ?, ?, ?, 0, 1)
	`
	
	_, err = database.DB.ExecContext(ctx, query, "", hashedPassword, req.Email, time.Now().Unix())
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error creating account")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "Account created successfully", nil)
}
