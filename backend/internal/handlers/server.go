package handlers

import (
	"net/http"

	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/utils"
)

// GetServerConfigHandler returns server configuration from config.lua
func GetServerConfigHandler(w http.ResponseWriter, r *http.Request) {
	publicConfig := config.GetPublicServerConfig()
	utils.WriteSuccess(w, http.StatusOK, "Server configuration retrieved successfully", publicConfig)
}

