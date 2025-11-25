package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/utils"
)

// MaintenanceStatus represents the maintenance mode status
type MaintenanceStatus struct {
	Enabled   bool   `json:"enabled"`
	Message   string `json:"message,omitempty"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

// GetMaintenanceStatusHandler returns the current maintenance status
func GetMaintenanceStatusHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var enabled bool
	var message sql.NullString
	var updatedAtStr sql.NullString

	err := database.DB.QueryRowContext(ctx,
		"SELECT enabled, message, updated_at FROM maintenance WHERE id = 1",
	).Scan(&enabled, &message, &updatedAtStr)

	status := MaintenanceStatus{
		Enabled: false,
		Message: "",
	}

	if err != nil {
		if err == sql.ErrNoRows {
			_, err = database.DB.ExecContext(ctx,
				"INSERT INTO maintenance (id, enabled, message, updated_at) VALUES (1, false, '', NOW())",
			)
			if err != nil {
				utils.WriteError(w, http.StatusInternalServerError, "Error initializing maintenance status")
				return
			}
		} else {
			utils.WriteError(w, http.StatusInternalServerError, "Error fetching maintenance status")
			return
		}
	} else {
		status.Enabled = enabled
		if message.Valid {
			status.Message = message.String
		}
		if updatedAtStr.Valid {
			parsedTime, err := time.Parse("2006-01-02 15:04:05", updatedAtStr.String)
			if err != nil {
				if parsedTime, err = time.Parse(time.RFC3339, updatedAtStr.String); err == nil {
					status.UpdatedAt = parsedTime.Format(time.RFC3339)
				}
			} else {
				status.UpdatedAt = parsedTime.Format(time.RFC3339)
			}
		}
	}

	utils.WriteSuccess(w, http.StatusOK, "Maintenance status retrieved successfully", status)
}

// GetMaintenanceStatusPublicHandler returns maintenance status for public access (message only)
func GetMaintenanceStatusPublicHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var enabled bool
	var message sql.NullString

	err := database.DB.QueryRowContext(ctx,
		"SELECT enabled, message FROM maintenance WHERE id = 1",
		).Scan(&enabled, &message)

	response := map[string]interface{}{
		"maintenance": false,
		"message":     "",
	}

	if err == nil && enabled {
		response["maintenance"] = true
		if message.Valid {
			response["message"] = message.String
		}
	}

	utils.WriteSuccess(w, http.StatusOK, "Maintenance status retrieved", response)
}

// ToggleMaintenanceHandler toggles maintenance mode
func ToggleMaintenanceHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var request struct {
		Enabled bool   `json:"enabled"`
		Message string `json:"message,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_, err := database.DB.ExecContext(ctx,
		"INSERT INTO maintenance (id, enabled, message, updated_at) VALUES (1, ?, ?, NOW()) ON DUPLICATE KEY UPDATE enabled = ?, message = ?, updated_at = NOW()",
		request.Enabled, request.Message, request.Enabled, request.Message,
	)

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error updating maintenance status")
		return
	}

	status := MaintenanceStatus{
		Enabled:   request.Enabled,
		Message:   request.Message,
		UpdatedAt: time.Now().Format(time.RFC3339),
	}

	utils.WriteSuccess(w, http.StatusOK, "Maintenance status updated successfully", status)
}

