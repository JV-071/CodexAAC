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
	"codexaac-backend/pkg/config"
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
			ORDER BY a.id ASC
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
			ORDER BY a.id ASC
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

type UpdateAdminAccountRequest struct {
	PremiumDays       *int  `json:"premiumDays"`
	Coins             *int  `json:"coins"`
	CoinsTransferable *int  `json:"coinsTransferable"`
	Status            *int  `json:"status"`
	IsAdmin           *bool `json:"isAdmin"`
}

func UpdateAdminAccountHandler(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateAdminAccountRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)", accountID).Scan(&exists)
	if err != nil || !exists {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	}

	updates := []string{}
	args := []interface{}{}

	if req.PremiumDays != nil {
		updates = append(updates, "premdays = ?")
		args = append(args, *req.PremiumDays)
	}

	if req.Coins != nil {
		updates = append(updates, "coins = ?")
		args = append(args, *req.Coins)
	}

	if req.CoinsTransferable != nil {
		updates = append(updates, "coins_transferable = ?")
		args = append(args, *req.CoinsTransferable)
	}

	if req.Status != nil {
		updates = append(updates, "status = ?")
		args = append(args, *req.Status)
	}

	if req.IsAdmin != nil {
		pageAccess := 0
		if *req.IsAdmin {
			pageAccess = 1
		}
		updates = append(updates, "page_access = ?")
		args = append(args, pageAccess)
	}

	if len(updates) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	args = append(args, accountID)

	query := "UPDATE accounts SET " + strings.Join(updates, ", ") + " WHERE id = ?"
	_, err = database.DB.ExecContext(ctx, query, args...)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error updating account")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Account updated successfully", nil)
}

type ExecuteAdminSQLRequest struct {
	SQL string `json:"sql"`
}

func ExecuteAdminSQLHandler(w http.ResponseWriter, r *http.Request) {
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

	var req ExecuteAdminSQLRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.SQL) == "" {
		utils.WriteError(w, http.StatusBadRequest, "SQL query cannot be empty")
		return
	}

	sqlUpper := strings.ToUpper(strings.TrimSpace(req.SQL))

	dangerousKeywords := []string{"DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"}
	for _, keyword := range dangerousKeywords {
		if strings.Contains(sqlUpper, keyword) {
			utils.WriteError(w, http.StatusBadRequest, "Dangerous SQL operations are not allowed")
			return
		}
	}

	if !strings.Contains(sqlUpper, "ACCOUNTS") {
		utils.WriteError(w, http.StatusBadRequest, "SQL query must target the accounts table")
		return
	}

	if !strings.Contains(sqlUpper, "WHERE") || !strings.Contains(sqlUpper, strconv.Itoa(accountID)) {
		utils.WriteError(w, http.StatusBadRequest, "SQL query must include WHERE clause with account ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)", accountID).Scan(&exists)
	if err != nil || !exists {
		utils.WriteError(w, http.StatusNotFound, "Account not found")
		return
	}

	result, err := database.DB.ExecContext(ctx, req.SQL)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error executing SQL: "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	response := map[string]interface{}{
		"rowsAffected": rowsAffected,
		"message":      "SQL executed successfully",
	}

	utils.WriteSuccess(w, http.StatusOK, "SQL executed successfully", response)
}

type AdminPlayer struct {
	ID                int    `json:"id"`
	Name              string `json:"name"`
	AccountID         int    `json:"accountId"`
	AccountEmail      string `json:"accountEmail"`
	Vocation          string `json:"vocation"`
	Level             int    `json:"level"`
	Experience        int64  `json:"experience"`
	Health            int    `json:"health"`
	HealthMax         int    `json:"healthMax"`
	Mana              int    `json:"mana"`
	ManaMax           int    `json:"manaMax"`
	MagicLevel        int    `json:"magicLevel"`
	SkillFist         int    `json:"skillFist"`
	SkillClub         int    `json:"skillClub"`
	SkillSword        int    `json:"skillSword"`
	SkillAxe          int    `json:"skillAxe"`
	SkillDist         int    `json:"skillDist"`
	SkillShielding    int    `json:"skillShielding"`
	SkillFishing      int    `json:"skillFishing"`
	Soul              int    `json:"soul"`
	Cap               int    `json:"cap"`
	TownID            int    `json:"townId"`
	TownName          string `json:"townName"`
	GuildName         string `json:"guildName"`
	GuildRank         string `json:"guildRank"`
	GroupID           int    `json:"groupId"`
	Status            string `json:"status"`
	LastLogin         string `json:"lastLogin,omitempty"`
	CreatedAt         string `json:"createdAt"`
}

func GetAdminPlayersHandler(w http.ResponseWriter, r *http.Request) {
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

	var players []AdminPlayer
	var query string
	var args []interface{}

	baseQuery := `
		SELECT
			p.id, p.name, p.account_id, a.email,
			p.vocation, p.level, p.experience,
			COALESCE(p.health, 0) as health,
			COALESCE(p.healthmax, 0) as healthmax,
			COALESCE(p.mana, 0) as mana,
			COALESCE(p.manamax, 0) as manamax,
			COALESCE(p.maglevel, 0) as maglevel,
			COALESCE(p.skill_fist, 10) as skill_fist,
			COALESCE(p.skill_club, 10) as skill_club,
			COALESCE(p.skill_sword, 10) as skill_sword,
			COALESCE(p.skill_axe, 10) as skill_axe,
			COALESCE(p.skill_dist, 10) as skill_dist,
			COALESCE(p.skill_shielding, 10) as skill_shielding,
			COALESCE(p.skill_fishing, 10) as skill_fishing,
			COALESCE(p.soul, 0) as soul,
			COALESCE(p.cap, 0) as cap,
			COALESCE(p.town_id, 0) as town_id,
			COALESCE(t.name, 'Unknown') as town_name,
			COALESCE(g.name, '') as guild_name,
			COALESCE(gr.name, '') as guild_rank,
			COALESCE(p.group_id, 1) as group_id,
			CASE WHEN po.player_id IS NOT NULL THEN 'online' ELSE 'offline' END as status,
			COALESCE(p.lastlogin, 0) as lastlogin,
			COALESCE(a.creation, 0) as creation
		FROM players p
		LEFT JOIN accounts a ON p.account_id = a.id
		LEFT JOIN players_online po ON p.id = po.player_id
		LEFT JOIN towns t ON p.town_id = t.id
		LEFT JOIN guild_membership gm ON p.id = gm.player_id
		LEFT JOIN guilds g ON gm.guild_id = g.id
		LEFT JOIN guild_ranks gr ON gm.rank_id = gr.id
		WHERE p.deletion = 0
	`

	if search != "" {
		query = baseQuery + " AND p.name LIKE ? ORDER BY p.level DESC, p.name ASC LIMIT ? OFFSET ?"
		args = []interface{}{"%" + search + "%", limit, offset}
	} else {
		query = baseQuery + " ORDER BY p.level DESC, p.name ASC LIMIT ? OFFSET ?"
		args = []interface{}{limit, offset}
	}

	rows, err := database.DB.QueryContext(ctx, query, args...)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching players")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var player AdminPlayer
		var vocationID int
		var lastlogin int64
		var creation int64

		err := rows.Scan(
			&player.ID, &player.Name, &player.AccountID, &player.AccountEmail,
			&vocationID, &player.Level, &player.Experience,
			&player.Health, &player.HealthMax,
			&player.Mana, &player.ManaMax,
			&player.MagicLevel,
			&player.SkillFist, &player.SkillClub, &player.SkillSword, &player.SkillAxe,
			&player.SkillDist, &player.SkillShielding, &player.SkillFishing,
			&player.Soul, &player.Cap,
			&player.TownID, &player.TownName,
			&player.GuildName, &player.GuildRank,
			&player.GroupID, &player.Status,
			&lastlogin, &creation,
		)
		if err != nil {
			continue
		}

		player.Vocation = config.GetVocationName(vocationID)
		if lastlogin > 0 {
			player.LastLogin = time.Unix(lastlogin, 0).Format("Jan 2, 2006, 15:04:05")
		}
		player.CreatedAt = time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")

		players = append(players, player)
	}

	var totalCount int
	countQuery := "SELECT COUNT(*) FROM players WHERE deletion = 0"
	if search != "" {
		countQuery += " AND name LIKE ?"
		_ = database.DB.QueryRowContext(ctx, countQuery, "%"+search+"%").Scan(&totalCount)
	} else {
		_ = database.DB.QueryRowContext(ctx, countQuery).Scan(&totalCount)
	}

	response := map[string]interface{}{
		"players": players,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}

	utils.WriteSuccess(w, http.StatusOK, "Players retrieved successfully", response)
}

func GetAdminPlayerDetailsHandler(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("id")
	if playerIDStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "Player ID is required")
		return
	}

	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil || playerID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid player ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var player AdminPlayer
	var vocationID int
	var lastlogin int64
	var creation int64

	err = database.DB.QueryRowContext(ctx,
		`SELECT
			p.id, p.name, p.account_id, a.email,
			p.vocation, p.level, p.experience,
			COALESCE(p.health, 0) as health,
			COALESCE(p.healthmax, 0) as healthmax,
			COALESCE(p.mana, 0) as mana,
			COALESCE(p.manamax, 0) as manamax,
			COALESCE(p.maglevel, 0) as maglevel,
			COALESCE(p.skill_fist, 10) as skill_fist,
			COALESCE(p.skill_club, 10) as skill_club,
			COALESCE(p.skill_sword, 10) as skill_sword,
			COALESCE(p.skill_axe, 10) as skill_axe,
			COALESCE(p.skill_dist, 10) as skill_dist,
			COALESCE(p.skill_shielding, 10) as skill_shielding,
			COALESCE(p.skill_fishing, 10) as skill_fishing,
			COALESCE(p.soul, 0) as soul,
			COALESCE(p.cap, 0) as cap,
			COALESCE(p.town_id, 0) as town_id,
			COALESCE(t.name, 'Unknown') as town_name,
			COALESCE(g.name, '') as guild_name,
			COALESCE(gr.name, '') as guild_rank,
			COALESCE(p.group_id, 1) as group_id,
			CASE WHEN po.player_id IS NOT NULL THEN 'online' ELSE 'offline' END as status,
			COALESCE(p.lastlogin, 0) as lastlogin,
			COALESCE(a.creation, 0) as creation
		FROM players p
		LEFT JOIN accounts a ON p.account_id = a.id
		LEFT JOIN players_online po ON p.id = po.player_id
		LEFT JOIN towns t ON p.town_id = t.id
		LEFT JOIN guild_membership gm ON p.id = gm.player_id
		LEFT JOIN guilds g ON gm.guild_id = g.id
		LEFT JOIN guild_ranks gr ON gm.rank_id = gr.id
		WHERE p.id = ? AND p.deletion = 0`,
		playerID,
	).Scan(
		&player.ID, &player.Name, &player.AccountID, &player.AccountEmail,
		&vocationID, &player.Level, &player.Experience,
		&player.Health, &player.HealthMax,
		&player.Mana, &player.ManaMax,
		&player.MagicLevel,
		&player.SkillFist, &player.SkillClub, &player.SkillSword, &player.SkillAxe,
		&player.SkillDist, &player.SkillShielding, &player.SkillFishing,
		&player.Soul, &player.Cap,
		&player.TownID, &player.TownName,
		&player.GuildName, &player.GuildRank,
		&player.GroupID, &player.Status,
		&lastlogin, &creation,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "Player not found")
			return
		}
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching player")
		return
	}

		player.Vocation = config.GetVocationName(vocationID)
	if lastlogin > 0 {
		player.LastLogin = time.Unix(lastlogin, 0).Format("Jan 2, 2006, 15:04:05")
	}
	player.CreatedAt = time.Unix(creation, 0).Format("Jan 2, 2006, 15:04:05")

	utils.WriteSuccess(w, http.StatusOK, "Player details retrieved successfully", player)
}

type UpdateAdminPlayerRequest struct {
	Name          *string `json:"name"`
	AccountID     *int    `json:"accountId"`
	Level         *int    `json:"level"`
	Experience    *int64  `json:"experience"`
	Health        *int    `json:"health"`
	HealthMax     *int    `json:"healthMax"`
	Mana          *int    `json:"mana"`
	ManaMax       *int    `json:"manaMax"`
	MagicLevel    *int    `json:"magicLevel"`
	SkillFist     *int    `json:"skillFist"`
	SkillClub     *int    `json:"skillClub"`
	SkillSword    *int    `json:"skillSword"`
	SkillAxe      *int    `json:"skillAxe"`
	SkillDist     *int    `json:"skillDist"`
	SkillShielding *int   `json:"skillShielding"`
	SkillFishing  *int    `json:"skillFishing"`
	Soul          *int    `json:"soul"`
	Cap           *int    `json:"cap"`
	TownID        *int    `json:"townId"`
	GroupID       *int    `json:"groupId"`
}

func UpdateAdminPlayerHandler(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("id")
	if playerIDStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "Player ID is required")
		return
	}

	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil || playerID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid player ID")
		return
	}

	var req UpdateAdminPlayerRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM players WHERE id = ? AND deletion = 0)", playerID).Scan(&exists)
	if err != nil || !exists {
		utils.WriteError(w, http.StatusNotFound, "Player not found")
		return
	}

	updates := []string{}
	args := []interface{}{}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			utils.WriteError(w, http.StatusBadRequest, "Player name cannot be empty")
			return
		}
		var nameExists bool
		err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM players WHERE name = ? AND id != ? AND deletion = 0)", name, playerID).Scan(&nameExists)
		if err != nil {
			if utils.HandleDBError(w, err) {
				return
			}
			utils.WriteError(w, http.StatusInternalServerError, "Error checking player name")
			return
		}
		if nameExists {
			utils.WriteError(w, http.StatusBadRequest, "Player name already exists")
			return
		}
		updates = append(updates, "name = ?")
		args = append(args, name)
	}

	if req.AccountID != nil {
		var accountExists bool
		err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)", *req.AccountID).Scan(&accountExists)
		if err != nil {
			if utils.HandleDBError(w, err) {
				return
			}
			utils.WriteError(w, http.StatusInternalServerError, "Error checking account")
			return
		}
		if !accountExists {
			utils.WriteError(w, http.StatusBadRequest, "Account not found")
			return
		}
		updates = append(updates, "account_id = ?")
		args = append(args, *req.AccountID)
	}

	if req.Level != nil {
		updates = append(updates, "level = ?")
		args = append(args, *req.Level)
	}

	if req.Experience != nil {
		updates = append(updates, "experience = ?")
		args = append(args, *req.Experience)
	}

	if req.Health != nil {
		updates = append(updates, "health = ?")
		args = append(args, *req.Health)
	}

	if req.HealthMax != nil {
		updates = append(updates, "healthmax = ?")
		args = append(args, *req.HealthMax)
	}

	if req.Mana != nil {
		updates = append(updates, "mana = ?")
		args = append(args, *req.Mana)
	}

	if req.ManaMax != nil {
		updates = append(updates, "manamax = ?")
		args = append(args, *req.ManaMax)
	}

	if req.MagicLevel != nil {
		updates = append(updates, "maglevel = ?")
		args = append(args, *req.MagicLevel)
	}

	if req.SkillFist != nil {
		updates = append(updates, "skill_fist = ?")
		args = append(args, *req.SkillFist)
	}

	if req.SkillClub != nil {
		updates = append(updates, "skill_club = ?")
		args = append(args, *req.SkillClub)
	}

	if req.SkillSword != nil {
		updates = append(updates, "skill_sword = ?")
		args = append(args, *req.SkillSword)
	}

	if req.SkillAxe != nil {
		updates = append(updates, "skill_axe = ?")
		args = append(args, *req.SkillAxe)
	}

	if req.SkillDist != nil {
		updates = append(updates, "skill_dist = ?")
		args = append(args, *req.SkillDist)
	}

	if req.SkillShielding != nil {
		updates = append(updates, "skill_shielding = ?")
		args = append(args, *req.SkillShielding)
	}

	if req.SkillFishing != nil {
		updates = append(updates, "skill_fishing = ?")
		args = append(args, *req.SkillFishing)
	}

	if req.Soul != nil {
		updates = append(updates, "soul = ?")
		args = append(args, *req.Soul)
	}

	if req.Cap != nil {
		updates = append(updates, "cap = ?")
		args = append(args, *req.Cap)
	}

	if req.TownID != nil {
		updates = append(updates, "town_id = ?")
		args = append(args, *req.TownID)
	}

	if req.GroupID != nil {
		updates = append(updates, "group_id = ?")
		args = append(args, *req.GroupID)
	}

	if len(updates) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	args = append(args, playerID)

	query := "UPDATE players SET " + strings.Join(updates, ", ") + " WHERE id = ?"
	_, err = database.DB.ExecContext(ctx, query, args...)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error updating player")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Player updated successfully", nil)
}

func ExecuteAdminPlayerSQLHandler(w http.ResponseWriter, r *http.Request) {
	playerIDStr := r.URL.Query().Get("id")
	if playerIDStr == "" {
		utils.WriteError(w, http.StatusBadRequest, "Player ID is required")
		return
	}

	playerID, err := strconv.Atoi(playerIDStr)
	if err != nil || playerID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid player ID")
		return
	}

	var req ExecuteAdminSQLRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.SQL) == "" {
		utils.WriteError(w, http.StatusBadRequest, "SQL query cannot be empty")
		return
	}

	sqlUpper := strings.ToUpper(strings.TrimSpace(req.SQL))

	dangerousKeywords := []string{"DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"}
	for _, keyword := range dangerousKeywords {
		if strings.Contains(sqlUpper, keyword) {
			utils.WriteError(w, http.StatusBadRequest, "Dangerous SQL operations are not allowed")
			return
		}
	}

	if !strings.Contains(sqlUpper, "PLAYERS") {
		utils.WriteError(w, http.StatusBadRequest, "SQL query must target the players table")
		return
	}

	if !strings.Contains(sqlUpper, "WHERE") || !strings.Contains(sqlUpper, strconv.Itoa(playerID)) {
		utils.WriteError(w, http.StatusBadRequest, "SQL query must include WHERE clause with player ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM players WHERE id = ? AND deletion = 0)", playerID).Scan(&exists)
	if err != nil || !exists {
		utils.WriteError(w, http.StatusNotFound, "Player not found")
		return
	}

	result, err := database.DB.ExecContext(ctx, req.SQL)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error executing SQL: "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	response := map[string]interface{}{
		"rowsAffected": rowsAffected,
		"message":      "SQL executed successfully",
	}

	utils.WriteSuccess(w, http.StatusOK, "SQL executed successfully", response)
}
