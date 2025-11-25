package handlers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
	"github.com/gorilla/mux"
)

const (
	MaxChangelogVersionLength = 50
	MaxChangelogTitleLength    = 255
	MaxChangelogDescLength     = 5000
	MaxChangelogLimit          = 100
	DefaultChangelogLimit     = 20
)

type Changelog struct {
	ID          int     `json:"id"`
	Version     string  `json:"version"`
	Title       string  `json:"title"`
	Description *string `json:"description,omitempty"`
	Type        string  `json:"type"`
	CreatedAt   int64   `json:"createdAt"`
	CreatedBy   *int    `json:"createdBy,omitempty"`
}

func GetChangelogsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := DefaultChangelogLimit

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= MaxChangelogLimit {
			limit = l
		}
	}

	offset := (page - 1) * limit

	query := `
		SELECT id, version, title, description, type, 
		       UNIX_TIMESTAMP(created_at) as created_at, created_by
		FROM changelogs
		ORDER BY created_at DESC, id DESC
		LIMIT ? OFFSET ?
	`

	rows, err := database.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching changelogs")
		return
	}
	defer rows.Close()

	changelogs := make([]Changelog, 0, limit)
	for rows.Next() {
		var changelog Changelog
		var description sql.NullString
		var createdBy sql.NullInt64

		if err := rows.Scan(
			&changelog.ID,
			&changelog.Version,
			&changelog.Title,
			&description,
			&changelog.Type,
			&changelog.CreatedAt,
			&createdBy,
		); err != nil {
			log.Printf("Error scanning changelog row: %v", err)
			continue
		}

		if description.Valid && description.String != "" {
			changelog.Description = &description.String
		}

		if createdBy.Valid && createdBy.Int64 > 0 {
			createdByID := int(createdBy.Int64)
			changelog.CreatedBy = &createdByID
		}

		changelogs = append(changelogs, changelog)
	}

	var totalCount int
	countQuery := "SELECT COUNT(*) FROM changelogs"
	err = database.DB.QueryRowContext(ctx, countQuery).Scan(&totalCount)
	if err != nil {
		totalCount = len(changelogs)
	}

	response := map[string]interface{}{
		"changelogs": changelogs,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}

	utils.WriteSuccess(w, http.StatusOK, "Changelogs retrieved successfully", response)
}

type CreateChangelogRequest struct {
	Version     string `json:"version"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"`
}

func CreateChangelogHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req CreateChangelogRequest
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

	req.Version = strings.TrimSpace(req.Version)
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.Type = strings.TrimSpace(req.Type)

	if req.Version == "" {
		utils.WriteError(w, http.StatusBadRequest, "Version is required")
		return
	}

	if len(req.Version) > MaxChangelogVersionLength {
		utils.WriteError(w, http.StatusBadRequest, "Version is too long (max "+strconv.Itoa(MaxChangelogVersionLength)+" characters)")
		return
	}

	if req.Title == "" {
		utils.WriteError(w, http.StatusBadRequest, "Title is required")
		return
	}

	if len(req.Title) > MaxChangelogTitleLength {
		utils.WriteError(w, http.StatusBadRequest, "Title is too long (max "+strconv.Itoa(MaxChangelogTitleLength)+" characters)")
		return
	}

	if len(req.Description) > MaxChangelogDescLength {
		utils.WriteError(w, http.StatusBadRequest, "Description is too long (max "+strconv.Itoa(MaxChangelogDescLength)+" characters)")
		return
	}

	if req.Type == "" {
		req.Type = "update"
	}

	validTypes := map[string]bool{
		"feature": true,
		"bugfix":  true,
		"update":  true,
		"hotfix":  true,
		"other":   true,
	}
	if !validTypes[req.Type] {
		req.Type = "update"
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	query := `
		INSERT INTO changelogs (version, title, description, type, created_by)
		VALUES (?, ?, ?, ?, ?)
	`

	var description *string
	if req.Description != "" {
		description = &req.Description
	}

	result, err := database.DB.ExecContext(ctx, query,
		req.Version,
		req.Title,
		description,
		req.Type,
		userID,
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error creating changelog")
		return
	}

	changelogID, err := result.LastInsertId()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error getting changelog ID")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "Changelog created successfully", map[string]interface{}{
		"id": int(changelogID),
	})
}

func DeleteChangelogHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	changelogIDStr := vars["id"]

	changelogID, err := strconv.Atoi(changelogIDStr)
	if err != nil || changelogID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid changelog ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	deleteQuery := "DELETE FROM changelogs WHERE id = ?"
	result, err := database.DB.ExecContext(ctx, deleteQuery, changelogID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error deleting changelog")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error checking deletion result")
		return
	}

	if rowsAffected == 0 {
		utils.WriteError(w, http.StatusNotFound, "Changelog not found")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Changelog deleted successfully", nil)
}

