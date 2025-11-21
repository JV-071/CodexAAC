package handlers

import (
	"net/http"
	"strconv"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
)

type AccountInfo struct {
	Email                  string `json:"email"`
	AccountType            string `json:"accountType"`
	PremiumDays            int    `json:"premiumDays"`
	VipExpiry              string `json:"vipExpiry,omitempty"`
	CreatedAt              string `json:"createdAt"`
	LastLogin              string `json:"lastLogin,omitempty"`
	CodexCoins             int    `json:"codexCoins"`
	CodexCoinsTransferable int    `json:"codexCoinsTransferable"`
	LoyaltyPoints          int    `json:"loyaltyPoints"`
	LoyaltyTitle           string `json:"loyaltyTitle,omitempty"`
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
	var coins int
	var coinsTransferable int

	err := database.DB.QueryRowContext(ctx,
		"SELECT email, premdays, lastday, creation, coins, coins_transferable FROM accounts WHERE id = ?",
		userID,
	).Scan(&email, &premdays, &lastday, &creation, &coins, &coinsTransferable)

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
	createdAt := time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")

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
		vipExpiry = expiryTime.Format("Jan 2, 2006, 15:04:05")
	}

	// Get last login from players table (most recent lastlogin)
	var lastLogin int64
	_ = database.DB.QueryRowContext(ctx,
		"SELECT COALESCE(MAX(lastlogin), 0) FROM players WHERE account_id = ?",
		userID,
	).Scan(&lastLogin)

	// Format last login date
	var lastLoginFormatted string
	if lastLogin > 0 {
		lastLoginFormatted = time.Unix(lastLogin, 0).Format("Jan 2, 2006, 15:04:05")
	}

	// Calculate loyalty points (simplified - can be enhanced later)
	// For now, using a simple calculation based on account age
	loyaltyPoints := 0
	if creation > 0 {
		accountAgeDays := int(time.Since(time.Unix(creation, 0)).Hours() / 24)
		loyaltyPoints = accountAgeDays / 30 // 1 point per 30 days
	}

	// Determine loyalty title based on points
	loyaltyTitle := "Scout of Codex"
	nextTitle := "Sentinel of Codex"
	nextTitlePoints := 1
	if loyaltyPoints >= 1 {
		loyaltyTitle = "Sentinel of Codex"
		nextTitle = "Steward of Codex"
		nextTitlePoints = 5
	}
	if loyaltyPoints >= 5 {
		loyaltyTitle = "Steward of Codex"
		nextTitle = "Warden of Codex"
		nextTitlePoints = 10
	}
	if loyaltyPoints >= 10 {
		loyaltyTitle = "Warden of Codex"
		nextTitle = "Squire of Codex"
		nextTitlePoints = 20
	}
	if loyaltyPoints >= 20 {
		loyaltyTitle = "Squire of Codex"
		nextTitle = "Knight of Codex"
		nextTitlePoints = 50
	}
	if loyaltyPoints >= 50 {
		loyaltyTitle = "Knight of Codex"
		nextTitle = "Elite Knight of Codex"
		nextTitlePoints = 100
	}

	loyaltyTitleFormatted := loyaltyTitle
	if loyaltyPoints < nextTitlePoints {
		loyaltyTitleFormatted = loyaltyTitle + " (Promotion to: " + nextTitle + " at " + strconv.Itoa(nextTitlePoints) + " Loyalty Points)"
	}

	accountInfo := AccountInfo{
		Email:                  email,
		AccountType:            accountType,
		PremiumDays:            premdays,
		CreatedAt:              createdAt,
		CodexCoins:             coins,
		CodexCoinsTransferable: coinsTransferable,
		LoyaltyPoints:          loyaltyPoints,
		LoyaltyTitle:           loyaltyTitleFormatted,
	}

	if vipExpiry != "" {
		accountInfo.VipExpiry = vipExpiry
	}

	if lastLoginFormatted != "" {
		accountInfo.LastLogin = lastLoginFormatted
	}

	utils.WriteSuccess(w, http.StatusOK, "Account information retrieved successfully", accountInfo)
}

