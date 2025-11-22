package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
	"github.com/gorilla/mux"
)

type CreateCharacterRequest struct {
	Name     string `json:"name"`
	Vocation string `json:"vocation"`
	Sex      string `json:"sex"`
}

type CreateCharacterResponse struct {
	Message string `json:"message"`
	ID      int    `json:"id,omitempty"`
}

func CreateCharacterHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req CreateCharacterRequest
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

	// Validate input
	req.Name = utils.SanitizeString(req.Name, 255)
	if req.Name == "" {
		utils.WriteError(w, http.StatusBadRequest, "Character name is required")
		return
	}

	if len(req.Name) < 3 || len(req.Name) > 20 {
		utils.WriteError(w, http.StatusBadRequest, "Character name must be between 3 and 20 characters")
		return
	}

	// Validate name contains only letters and spaces
	nameRegex := utils.GetNameRegex()
	if !nameRegex.MatchString(req.Name) {
		utils.WriteError(w, http.StatusBadRequest, "Character name must contain only letters and spaces")
		return
	}

	// Validate vocation
	vocationID, ok := config.VocationMapping[strings.ToLower(req.Vocation)]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "Invalid vocation")
		return
	}

	// Validate sex
	sexID, ok := config.SexMapping[strings.ToLower(req.Sex)]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, "Invalid sex")
		return
	}

	// Get character creation config
	charConfig := config.GetCharacterCreationConfig()

	// Get looktype based on sex
	lookType, ok := config.LookTypeMapping[sexID]
	if !ok {
		// Fallback to female looktype if sex is invalid (should not happen after validation)
		lookType = 136
	}

	// Create context with timeout
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Check if character name already exists
	var exists bool
	err := database.DB.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM players WHERE name = ?)", req.Name).Scan(&exists)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking character name")
		return
	}

	if exists {
		utils.WriteError(w, http.StatusConflict, "Character name already exists")
		return
	}

	// Insert character into database
	// Note: conditions field is required (BLOB), using empty blob
	query := `
		INSERT INTO players (
			name, account_id, vocation, health, healthmax, mana, manamax,
			experience, town_id, sex, maglevel, level,
			skill_fist, skill_club, skill_sword, skill_axe, skill_dist,
			skill_shielding, skill_fishing, conditions,
			lookbody, lookfeet, lookhead, looklegs, looktype
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := database.DB.ExecContext(ctx, query,
		req.Name,           // name
		userID,             // account_id
		vocationID,         // vocation
		charConfig.Health,  // health
		charConfig.MaxHealth, // healthmax
		charConfig.Mana,    // mana
		charConfig.MaxMana, // manamax
		charConfig.Experience, // experience
		charConfig.TownID,  // town_id
		sexID,              // sex
		charConfig.MagLevel, // maglevel
		charConfig.Level,   // level
		charConfig.SkillFist,      // skill_fist
		charConfig.SkillClub,      // skill_club
		charConfig.SkillSword,     // skill_sword
		charConfig.SkillAxe,       // skill_axe
		charConfig.SkillDist,      // skill_dist
		charConfig.SkillShielding, // skill_shielding
		charConfig.SkillFishing,   // skill_fishing
		[]byte{},           // conditions (empty blob)
		charConfig.LookBody, // lookbody
		charConfig.LookFeet, // lookfeet
		charConfig.LookHead, // lookhead
		charConfig.LookLegs, // looklegs
		lookType,            // looktype (based on sex: male=128, female=136)
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		// Don't expose database error details to client (security)
		utils.WriteError(w, http.StatusInternalServerError, "Error creating character")
		return
	}

	// Get the inserted character ID
	characterID, err := result.LastInsertId()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error getting character ID")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "Character created successfully", CreateCharacterResponse{
		ID: int(characterID),
	})
}

// GetCharactersHandler returns all characters for the authenticated user
func GetCharactersHandler(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	type Character struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		Vocation string `json:"vocation"`
		Level    int    `json:"level"`
		World    string `json:"world"`
		Status   string `json:"status"`
	}

	// Query to get characters with online status
	// LEFT JOIN with players_online to check if character is online
	query := `
		SELECT 
			p.id, 
			p.name, 
			p.vocation, 
			p.level,
			CASE WHEN po.player_id IS NOT NULL THEN 'online' ELSE 'offline' END as status
		FROM players p
		LEFT JOIN players_online po ON p.id = po.player_id
		WHERE p.account_id = ?
		ORDER BY p.name
	`

	rows, err := database.DB.QueryContext(ctx, query, userID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching characters")
		return
	}
	defer rows.Close()

	// Pre-allocate slice with estimated capacity (most users have 1-5 characters)
	characters := make([]Character, 0, 5)
	for rows.Next() {
		var char Character
		var vocationID int
		var status string
		
		if err := rows.Scan(&char.ID, &char.Name, &vocationID, &char.Level, &status); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Error reading character data")
			return
		}

			// Convert vocation ID to name using centralized config
		char.Vocation = config.GetVocationName(vocationID)

		char.Status = status
		// Get world name from server config (fallback to default)
		char.World = config.GetServerName()

		characters = append(characters, char)
	}

	if err = rows.Err(); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error processing characters")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Characters retrieved successfully", characters)
}

// GetCharacterDetailsHandler returns detailed information about a character by name
func GetCharacterDetailsHandler(w http.ResponseWriter, r *http.Request) {
	// Get character name from URL path
	vars := mux.Vars(r)
	characterName := vars["name"]

	if characterName == "" {
		utils.WriteError(w, http.StatusBadRequest, "Character name is required")
		return
	}

	// Sanitize character name
	characterName = utils.SanitizeString(characterName, 255)

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	type CharacterDetails struct {
		Name         string `json:"name"`
		Sex          string `json:"sex"`
		Vocation     string `json:"vocation"`
		Level        int    `json:"level"`
		Residence    string `json:"residence"`
		GuildName    string `json:"guildName,omitempty"`
		GuildRank    string `json:"guildRank,omitempty"`
		LastSeen     int64  `json:"lastSeen"`
		Created      int64  `json:"created"`
		AccountStatus string `json:"accountStatus"`
		Status       string `json:"status"` // online/offline
	}

	type Death struct {
		Time      int64  `json:"time"`
		Level     int    `json:"level"`
		KilledBy  string `json:"killedBy"`
		IsPlayer  bool   `json:"isPlayer"`
	}

	type CharacterDetailsResponse struct {
		Character CharacterDetails `json:"character"`
		Deaths    []Death          `json:"deaths"`
	}

	// Query character details
	var char CharacterDetails
	var vocationID, sexID int
	var lastLogin, created int64
	var townName, guildName, guildRank sql.NullString
	var premdays int

	// Optimized query: Get all data in one query with JOINs (reduces from 3 queries to 1)
	// Note: players table doesn't have a creation field, using account creation as fallback
	query := `
		SELECT 
			p.id,
			p.name,
			p.sex,
			p.vocation,
			p.level,
			p.lastlogin,
			COALESCE(a.creation, 0) as creation,
			CASE WHEN po.player_id IS NOT NULL THEN 'online' ELSE 'offline' END as status,
			COALESCE(t.name, 'Unknown') as town_name,
			g.name as guild_name,
			gr.name as guild_rank,
			COALESCE(a.premdays, 0) as premdays
		FROM players p
		LEFT JOIN players_online po ON p.id = po.player_id
		LEFT JOIN towns t ON p.town_id = t.id
		LEFT JOIN guild_membership gm ON p.id = gm.player_id
		LEFT JOIN guilds g ON gm.guild_id = g.id
		LEFT JOIN guild_ranks gr ON gm.rank_id = gr.id
		LEFT JOIN accounts a ON p.account_id = a.id
		WHERE p.name = ?
		LIMIT 1
	`

	var playerID int
	err := database.DB.QueryRowContext(ctx, query, characterName).Scan(
		&playerID,
		&char.Name,
		&sexID,
		&vocationID,
		&char.Level,
		&lastLogin,
		&created,
		&char.Status,
		&townName,
		&guildName,
		&guildRank,
		&premdays,
	)

	if err == sql.ErrNoRows {
		utils.WriteError(w, http.StatusNotFound, "Character not found")
		return
	}

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching character details")
		return
	}

	// Convert vocation ID to name
	char.Vocation = config.GetVocationName(vocationID)

	// Convert sex ID to string using config
	char.Sex = config.GetSexName(sexID)

	// Set residence from JOIN result
	if townName.Valid {
		char.Residence = townName.String
	} else {
		char.Residence = "Unknown"
	}

	// Set guild info if exists
	if guildName.Valid {
		char.GuildName = guildName.String
	}
	if guildRank.Valid {
		char.GuildRank = guildRank.String
	}

	// Convert timestamps
	char.LastSeen = lastLogin
	char.Created = created

	// Set account status (premium/free) - already from JOIN
	if premdays > 0 {
		char.AccountStatus = "VIP Account"
	} else {
		char.AccountStatus = "Free Account"
	}

	// Query deaths
	deathsQuery := `
		SELECT time, level, killed_by, is_player
		FROM player_deaths
		WHERE player_id = ?
		ORDER BY time DESC
		LIMIT 20
	`

	rows, err := database.DB.QueryContext(ctx, deathsQuery, playerID)
	if err != nil {
		// Log error but don't fail the request
		// Deaths are optional
	}

	deaths := make([]Death, 0)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var death Death
			if err := rows.Scan(&death.Time, &death.Level, &death.KilledBy, &death.IsPlayer); err == nil {
				deaths = append(deaths, death)
			}
		}
	}

	response := CharacterDetailsResponse{
		Character: char,
		Deaths:    deaths,
	}

	utils.WriteSuccess(w, http.StatusOK, "Character details retrieved successfully", response)
}

