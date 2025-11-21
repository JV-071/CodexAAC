package handlers

import (
	"errors"
	"net/http"
	"strings"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
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
		char.World = "Codex" // Default world name

		characters = append(characters, char)
	}

	if err = rows.Err(); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error processing characters")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Characters retrieved successfully", characters)
}

