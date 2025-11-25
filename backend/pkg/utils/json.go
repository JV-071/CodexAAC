package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

var (
	ErrBodyTooLarge      = errors.New("request body too large")
	ErrInvalidContentType = errors.New("content-type must be application/json")
)

func DecodeJSON(r *http.Request, v interface{}) error {
	contentType := r.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return ErrInvalidContentType
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	
	if err := decoder.Decode(v); err != nil {
		if strings.Contains(err.Error(), "http: request body too large") {
			return ErrBodyTooLarge
		}
		return err
	}
	
	return nil
}

