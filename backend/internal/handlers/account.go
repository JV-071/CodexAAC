package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/config"
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
	DeletionScheduledAt    *int64 `json:"deletionScheduledAt,omitempty"`
	Status                 string `json:"status"`
}

type DeleteAccountRequest struct {
	Password string `json:"password"`
}

const (
	AccountStatusActive         = "active"
	AccountStatusPendingDeletion = "pending_deletion"
	DefaultDeletionGracePeriodDays = 30
)

func getDeletionGracePeriodDays() int {
	gracePeriodStr := os.Getenv("ACCOUNT_DELETION_GRACE_PERIOD_DAYS")
	if gracePeriodStr == "" {
		return DefaultDeletionGracePeriodDays
	}
	
	gracePeriod, err := strconv.Atoi(gracePeriodStr)
	if err != nil || gracePeriod < 1 {
		return DefaultDeletionGracePeriodDays
	}
	
	return gracePeriod
}

func GetAccountHandler(w http.ResponseWriter, r *http.Request) {
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

	var deletionScheduledAt sql.NullInt64
	var status string

	err := database.DB.QueryRowContext(ctx,
		"SELECT email, premdays, lastday, creation, coins, coins_transferable, COALESCE(deletion_scheduled_at, 0), COALESCE(status, 'active') FROM accounts WHERE id = ?",
		userID,
	).Scan(&email, &premdays, &lastday, &creation, &coins, &coinsTransferable, &deletionScheduledAt, &status)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching account information")
		return
	}

	serverConfig := config.GetServerConfig()
	accountType := "Free Account"
	if premdays > 0 || serverConfig.FreePremium {
		accountType = "Premium Account"
	}

	createdAt := time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")

	var vipExpiry string
	if premdays > 0 {
		var baseTime int64
		if lastday > 0 {
			baseTime = lastday
		} else {
			baseTime = creation
		}
		expiryTime := time.Unix(baseTime, 0).AddDate(0, 0, premdays)
		vipExpiry = expiryTime.Format("Jan 2, 2006, 15:04:05")
	}

	var lastLogin int64
	_ = database.DB.QueryRowContext(ctx,
		"SELECT COALESCE(MAX(lastlogin), 0) FROM players WHERE account_id = ?",
		userID,
	).Scan(&lastLogin)

	var lastLoginFormatted string
	if lastLogin > 0 {
		lastLoginFormatted = time.Unix(lastLogin, 0).Format("Jan 2, 2006, 15:04:05")
	}

	loyaltyPoints := 0
	if creation > 0 {
		accountAgeDays := int(time.Since(time.Unix(creation, 0)).Hours() / 24)
		loyaltyPoints = accountAgeDays / 30
	}

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
		Status:                 status,
	}

	if vipExpiry != "" {
		accountInfo.VipExpiry = vipExpiry
	}

	if lastLoginFormatted != "" {
		accountInfo.LastLogin = lastLoginFormatted
	}

	if deletionScheduledAt.Valid && deletionScheduledAt.Int64 > 0 {
		deletionTime := deletionScheduledAt.Int64
		accountInfo.DeletionScheduledAt = &deletionTime
	}

	utils.WriteSuccess(w, http.StatusOK, "Account information retrieved successfully", accountInfo)
}

func DeleteAccountHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req DeleteAccountRequest
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

	if req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "Password is required")
		return
	}

	if len(req.Password) > 128 {
		utils.WriteError(w, http.StatusBadRequest, "Password too long")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var storedPassword string
	var currentStatus string
	err := database.DB.QueryRowContext(ctx,
		"SELECT password, COALESCE(status, 'active') FROM accounts WHERE id = ?",
		userID,
	).Scan(&storedPassword, &currentStatus)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "Account not found")
			return
		}
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error verifying account")
		return
	}

	if currentStatus == AccountStatusPendingDeletion {
		utils.WriteError(w, http.StatusBadRequest, "Account is already scheduled for deletion")
		return
	}

	hashedPassword := utils.HashSHA1(req.Password)
	if storedPassword != hashedPassword {
		utils.WriteError(w, http.StatusBadRequest, "Invalid password")
		return
	}

	var exists int
	err = database.DB.QueryRowContext(ctx,
		`SELECT 1 
		 FROM players p 
		 INNER JOIN players_online po ON p.id = po.player_id 
		 WHERE p.account_id = ?
		 LIMIT 1`,
		userID,
	).Scan(&exists)

	if err != nil && err != sql.ErrNoRows {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking online status")
		return
	}

	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, "Cannot delete account while characters are online. Please log out all characters first.")
		return
	}

	gracePeriodDays := getDeletionGracePeriodDays()
	deletionTime := time.Now().AddDate(0, 0, gracePeriodDays).Unix()

	_, err = database.DB.ExecContext(ctx,
		"UPDATE accounts SET deletion_scheduled_at = ?, status = ? WHERE id = ?",
		deletionTime, AccountStatusPendingDeletion, userID,
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error scheduling account deletion")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Account scheduled for deletion. You have "+strconv.Itoa(gracePeriodDays)+" days to cancel.", map[string]interface{}{
		"deletionScheduledAt": deletionTime,
		"gracePeriodDays":     gracePeriodDays,
	})
}

// CancelDeletionHandler cancels scheduled account deletion
func CancelDeletionHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var currentStatus string
	err := database.DB.QueryRowContext(ctx,
		"SELECT COALESCE(status, 'active') FROM accounts WHERE id = ?",
		userID,
	).Scan(&currentStatus)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "Account not found")
			return
		}
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking account status")
		return
	}

	if currentStatus != AccountStatusPendingDeletion {
		utils.WriteError(w, http.StatusBadRequest, "Account is not scheduled for deletion")
		return
	}

	_, err = database.DB.ExecContext(ctx,
		"UPDATE accounts SET deletion_scheduled_at = NULL, status = ? WHERE id = ?",
		AccountStatusActive, userID,
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error canceling account deletion")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Account deletion canceled successfully", nil)
}

