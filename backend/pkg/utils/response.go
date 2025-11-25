package utils

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func WriteError(w http.ResponseWriter, statusCode int, message string) {
	WriteJSON(w, statusCode, map[string]string{"message": message})
}

func WriteSuccess(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	response := map[string]interface{}{
		"message": message,
		"status":  "success",
	}
	if data != nil {
		response["data"] = data
	}
	WriteJSON(w, statusCode, response)
}

