package handlers

import (
	"net/http"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
)

type AccountInfo struct {
	Email       string `json:"email"`
	AccountType string `json:"accountType"`
	PremiumDays int    `json:"premiumDays"`
	VipExpiry   string `json:"vipExpiry,omitempty"`
	CreatedAt   string `json:"createdAt"`
}

// GetAccountHandler returns account information for the authenticated user
func GetAccountHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var email string
	var premdays int
	var lastday int64
	var creation int64

	err := database.DB.QueryRowContext(ctx,
		"SELECT email, premdays, lastday, creation FROM accounts WHERE id = ?",
		userID,
	).Scan(&email, &premdays, &lastday, &creation)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching account information")
		return
	}

	// Determine account type based on premium days
	accountType := "Free Account"
	if premdays > 0 {
		accountType = "Premium Account"
	}

	// Format creation date
	createdAt := time.Unix(creation, 0).Format("Jan 2, 2006")

	// Calculate VIP expiry if premium days > 0
	var vipExpiry string
	if premdays > 0 {
		// Calculate expiry: lastday (when premium was activated) + premdays
		// If lastday is 0, use creation date as fallback
		var baseTime int64
		if lastday > 0 {
			baseTime = lastday
		} else {
			baseTime = creation
		}
		expiryTime := time.Unix(baseTime, 0).AddDate(0, 0, premdays)
		vipExpiry = expiryTime.Format("Jan 2, 2006, 15:04:05 MST")
	}

	accountInfo := AccountInfo{
		Email:       email,
		AccountType: accountType,
		PremiumDays: premdays,
		CreatedAt:   createdAt,
	}

	if vipExpiry != "" {
		accountInfo.VipExpiry = vipExpiry
	}

	utils.WriteSuccess(w, http.StatusOK, "Account information retrieved successfully", accountInfo)
}

