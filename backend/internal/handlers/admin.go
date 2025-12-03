package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

// AdminStats represents server statistics
type AdminStats struct {
	TotalAccounts      int `json:"totalAccounts"`
	ActiveAccounts     int `json:"activeAccounts"`
	PendingDeletion    int `json:"pendingDeletion"`
	TotalCharacters    int `json:"totalCharacters"`
	OnlineCharacters   int `json:"onlineCharacters"`
	TotalPremiumDays   int `json:"totalPremiumDays"`
	TotalCoins         int `json:"totalCoins"`
	AccountsCreated24h int `json:"accountsCreated24h"`
	AccountsCreated7d   int `json:"accountsCreated7d"`
	AccountsCreated30d  int `json:"accountsCreated30d"`
}

// AdminAccount represents account information for admin view
type AdminAccount struct {
	ID                  int    `json:"id"`
	Email               string `json:"email"`
	AccountType         string `json:"accountType"`
	PremiumDays         int    `json:"premiumDays"`
	Coins               int    `json:"coins"`
	CoinsTransferable   int    `json:"coinsTransferable"`
	CreatedAt           string `json:"createdAt"`
	LastLogin           string `json:"lastLogin,omitempty"`
	Status              string `json:"status"`
	CharactersCount     int    `json:"charactersCount"`
	IsAdmin             bool   `json:"isAdmin"`
}

// GetAdminStatsHandler returns server statistics
func GetAdminStatsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	stats := AdminStats{}

	_ = database.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM accounts").Scan(&stats.TotalAccounts)

	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM accounts WHERE status = 'active'",
	).Scan(&stats.ActiveAccounts)

	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM accounts WHERE status = 'pending_deletion'",
	).Scan(&stats.PendingDeletion)

	_ = database.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM players").Scan(&stats.TotalCharacters)

	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM players_online",
	).Scan(&stats.OnlineCharacters)

	_ = database.DB.QueryRowContext(ctx,
		"SELECT COALESCE(SUM(premdays), 0) FROM accounts",
	).Scan(&stats.TotalPremiumDays)

	_ = database.DB.QueryRowContext(ctx,
		"SELECT COALESCE(SUM(coins), 0) FROM accounts",
	).Scan(&stats.TotalCoins)

	now := time.Now().Unix()
	dayAgo := now - (24 * 60 * 60)
	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM accounts WHERE creation >= ?",
		dayAgo,
	).Scan(&stats.AccountsCreated24h)

	weekAgo := now - (7 * 24 * 60 * 60)
	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM accounts WHERE creation >= ?",
		weekAgo,
	).Scan(&stats.AccountsCreated7d)

	monthAgo := now - (30 * 24 * 60 * 60)
	_ = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM accounts WHERE creation >= ?",
		monthAgo,
	).Scan(&stats.AccountsCreated30d)

	utils.WriteSuccess(w, http.StatusOK, "Statistics retrieved successfully", stats)
}

// GetAdminAccountsHandler returns paginated list of accounts
func GetAdminAccountsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	search := r.URL.Query().Get("search")

	page := 1
	limit := 50

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	var accounts []AdminAccount
	var query string
	var args []interface{}

	if search != "" {
		query = `
			SELECT a.id, a.email, a.premdays, a.coins, a.coins_transferable,
			       a.creation, a.status, a.page_access,
			       COALESCE(MAX(p.lastlogin), 0) as lastlogin,
			       COUNT(DISTINCT p.id) as characters_count
			FROM accounts a
			LEFT JOIN players p ON p.account_id = a.id
			WHERE a.email LIKE ?
			GROUP BY a.id
			ORDER BY a.id DESC
			LIMIT ? OFFSET ?
		`
		args = []interface{}{"%" + search + "%", limit, offset}
	} else {
		query = `
			SELECT a.id, a.email, a.premdays, a.coins, a.coins_transferable,
			       a.creation, a.status, a.page_access,
			       COALESCE(MAX(p.lastlogin), 0) as lastlogin,
			       COUNT(DISTINCT p.id) as characters_count
			FROM accounts a
			LEFT JOIN players p ON p.account_id = a.id
			GROUP BY a.id
			ORDER BY a.id DESC
			LIMIT ? OFFSET ?
		`
		args = []interface{}{limit, offset}
	}

	rows, err := database.DB.QueryContext(ctx, query, args...)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching accounts")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var acc AdminAccount
		var premdays int
		var creation int64
		var lastlogin int64
		var pageAccess int

		err := rows.Scan(
			&acc.ID, &acc.Email, &premdays, &acc.Coins, &acc.CoinsTransferable,
			&creation, &acc.Status, &pageAccess, &lastlogin, &acc.CharactersCount,
		)
		if err != nil {
			continue
		}

		if premdays > 0 {
			acc.AccountType = "Premium Account"
		} else {
			acc.AccountType = "Free Account"
		}

		acc.PremiumDays = premdays
		acc.CreatedAt = time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")
		acc.IsAdmin = (pageAccess == 1)

		if lastlogin > 0 {
			acc.LastLogin = time.Unix(lastlogin, 0).Format("Jan 2, 2006, 15:04:05")
		}

		accounts = append(accounts, acc)
	}

	var totalCount int
	countQuery := "SELECT COUNT(*) FROM accounts"
	if search != "" {
		countQuery += " WHERE email LIKE ?"
		_ = database.DB.QueryRowContext(ctx, countQuery, "%"+search+"%").Scan(&totalCount)
	} else {
		_ = database.DB.QueryRowContext(ctx, countQuery).Scan(&totalCount)
	}

	response := map[string]interface{}{
		"accounts":   accounts,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}

	utils.WriteSuccess(w, http.StatusOK, "Accounts retrieved successfully", response)
}

// GetAdminAccountDetailsHandler returns detailed information about a specific account
func GetAdminAccountDetailsHandler(w http.ResponseWriter, r *http.Request) {
	accountIDStr := r.URL.Query().Get("id")
	if accountIDStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "Account ID is required")
		return
	}

	accountID, err := strconv.Atoi(accountIDStr)
	if err != nil || accountID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var acc AdminAccount
	var premdays int
	var creation int64
	var lastlogin int64
	var pageAccess int
	err = database.DB.QueryRowContext(ctx,
		`SELECT a.id, a.email, a.premdays, a.coins, a.coins_transferable,
		        a.creation, a.status, a.page_access,
		        COALESCE(MAX(p.lastlogin), 0) as lastlogin,
		        COUNT(DISTINCT p.id) as characters_count
		 FROM accounts a
		 LEFT JOIN players p ON p.account_id = a.id
		 WHERE a.id = ?
		 GROUP BY a.id`,
		accountID,
	).Scan(
		&acc.ID, &acc.Email, &premdays, &acc.Coins, &acc.CoinsTransferable,
		&creation, &acc.Status, &pageAccess, &lastlogin, &acc.CharactersCount,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "Account not found")
			return
		}
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching account")
		return
	}

	acc.PremiumDays = premdays
	if premdays > 0 {
		acc.AccountType = "Premium Account"
	} else {
		acc.AccountType = "Free Account"
	}
	acc.CreatedAt = time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")
	acc.IsAdmin = (pageAccess == 1)

	if lastlogin > 0 {
		acc.LastLogin = time.Unix(lastlogin, 0).Format("Jan 2, 2006, 15:04:05")
	}

	utils.WriteSuccess(w, http.StatusOK, "Account details retrieved successfully", acc)
}

type LogFile struct {
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	Modified string `json:"modified"`
}

func GetLogsListHandler(w http.ResponseWriter, r *http.Request) {
	serverPath := os.Getenv("SERVER_PATH")
	if serverPath == "" {
		utils.WriteError(w, http.StatusBadRequest, "SERVER_PATH not configured")
		return
	}

	logsPath := filepath.Join(serverPath, "logs")

	if _, err := os.Stat(logsPath); os.IsNotExist(err) {
		utils.WriteSuccess(w, http.StatusOK, "Logs directory not found", []LogFile{})
		return
	}

	files, err := os.ReadDir(logsPath)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error reading logs directory")
		return
	}

	var logFiles []LogFile
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(strings.ToLower(file.Name()), ".txt") {
			info, err := file.Info()
			if err != nil {
				continue
			}
			logFiles = append(logFiles, LogFile{
				Name:     file.Name(),
				Size:     info.Size(),
				Modified: info.ModTime().Format("2006-01-02 15:04:05"),
			})
		}
	}

	utils.WriteSuccess(w, http.StatusOK, "Logs retrieved successfully", logFiles)
}

func GetLogContentHandler(w http.ResponseWriter, r *http.Request) {
	fileName := r.URL.Query().Get("file")
	if fileName == "" {
		utils.WriteError(w, http.StatusBadRequest, "File name is required")
		return
	}

	if strings.Contains(fileName, "..") || strings.Contains(fileName, "/") || strings.Contains(fileName, "\\") {
		utils.WriteError(w, http.StatusBadRequest, "Invalid file name")
		return
	}

	if !strings.HasSuffix(strings.ToLower(fileName), ".txt") {
		utils.WriteError(w, http.StatusBadRequest, "Only .txt files are allowed")
		return
	}

	serverPath := os.Getenv("SERVER_PATH")
	if serverPath == "" {
		utils.WriteError(w, http.StatusBadRequest, "SERVER_PATH not configured")
		return
	}

	logsPath := filepath.Join(serverPath, "logs")

	if _, err := os.Stat(logsPath); os.IsNotExist(err) {
		utils.WriteError(w, http.StatusNotFound, "Logs directory not found")
		return
	}

	filePath := filepath.Join(logsPath, fileName)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		utils.WriteError(w, http.StatusNotFound, "Log file not found")
		return
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error reading log file")
		return
	}

	maxSize := 10 * 1024 * 1024
	if len(content) > maxSize {
		content = content[len(content)-maxSize:]
	}

	response := map[string]interface{}{
		"fileName": fileName,
		"content":  string(content),
		"size":     len(content),
	}

	utils.WriteSuccess(w, http.StatusOK, "Log content retrieved successfully", response)
}

