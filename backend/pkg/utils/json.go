package utils

import (
	"encoding/json"
	"net/http"
)

// DecodeJSON decodes JSON request body
func DecodeJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

