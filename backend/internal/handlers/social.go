package handlers

import (
	"net/http"
	"os"

	"codexaac-backend/pkg/utils"
)

type SocialLinksResponse struct {
	Facebook  string `json:"facebook"`
	Instagram string `json:"instagram"`
	WhatsApp  string `json:"whatsapp"`
	Discord   string `json:"discord"`
}

func GetSocialLinksHandler(w http.ResponseWriter, r *http.Request) {
	links := SocialLinksResponse{
		Facebook:  getEnvWithDefault("SOCIAL_FACEBOOK_URL", ""),
		Instagram: getEnvWithDefault("SOCIAL_INSTAGRAM_URL", ""),
		WhatsApp:  getEnvWithDefault("SOCIAL_WHATSAPP_URL", ""),
		Discord:   getEnvWithDefault("SOCIAL_DISCORD_URL", ""),
	}

	utils.WriteSuccess(w, http.StatusOK, "Social links retrieved successfully", links)
}

func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

