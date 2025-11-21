package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

// Custom error types for better error handling
var (
	ErrBodyTooLarge      = errors.New("request body too large")
	ErrInvalidContentType = errors.New("content-type must be application/json")
)

// DecodeJSON decodes JSON request body with error handling
func DecodeJSON(r *http.Request, v interface{}) error {
	// Check Content-Type
	contentType := r.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return ErrInvalidContentType
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields() // Reject unknown fields for security
	
	if err := decoder.Decode(v); err != nil {
		// Check if it's a max bytes error (body too large)
		if strings.Contains(err.Error(), "http: request body too large") {
			return ErrBodyTooLarge
		}
		return err
	}
	
	return nil
}

