package handlers

import (
	"net/http"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/utils"
)

type TeamPlayer struct {
	Name      string `json:"name"`
	GroupID   int    `json:"groupId"`
	Role      string `json:"role"`
	World     string `json:"world"`
	LookType  int    `json:"lookType"`
	LookHead  int    `json:"lookHead"`
	LookBody  int    `json:"lookBody"`
	LookLegs  int    `json:"lookLegs"`
	LookFeet  int    `json:"lookFeet"`
	LookAddons int   `json:"lookAddons"`
}

type TeamResponse struct {
	Tutors        []TeamPlayer `json:"tutors"`
	Administration []TeamPlayer `json:"administration"`
}

func getRoleName(groupID int) string {
	switch groupID {
	case 2:
		return "Tutor"
	case 3:
		return "Senior Tutor"
	case 4:
		return "Gamemaster"
	case 5:
		return "Community Manager"
	case 6:
		return "Administrator"
	default:
		return "Unknown"
	}
}

func GetTeamHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	query := `
		SELECT
			p.name,
			p.group_id,
			COALESCE(NULLIF(p.looktype, 0), 128) as looktype,
			COALESCE(p.lookhead, 0) as lookhead,
			COALESCE(p.lookbody, 0) as lookbody,
			COALESCE(p.looklegs, 0) as looklegs,
			COALESCE(p.lookfeet, 0) as lookfeet,
			COALESCE(p.lookaddons, 0) as lookaddons
		FROM players p
		WHERE p.deletion = 0 AND p.group_id >= 2
		ORDER BY p.group_id DESC, p.name ASC
	`

	rows, err := database.DB.QueryContext(ctx, query)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching team members")
		return
	}
	defer rows.Close()

	var tutors []TeamPlayer
	var administration []TeamPlayer
	worldName := config.GetServerName()

	for rows.Next() {
		var player TeamPlayer
		var groupID int

		if err := rows.Scan(
			&player.Name,
			&groupID,
			&player.LookType,
			&player.LookHead,
			&player.LookBody,
			&player.LookLegs,
			&player.LookFeet,
			&player.LookAddons,
		); err != nil {
			continue
		}

		player.GroupID = groupID
		player.Role = getRoleName(groupID)
		player.World = worldName

		if groupID >= 2 && groupID <= 3 {
			tutors = append(tutors, player)
		} else if groupID >= 4 {
			administration = append(administration, player)
		}
	}

	response := TeamResponse{
		Tutors:         tutors,
		Administration: administration,
	}

	utils.WriteSuccess(w, http.StatusOK, "Team members retrieved successfully", response)
}
