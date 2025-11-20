package utils

import (
	"context"
	"errors"
	"net/http"
	"time"
)

// NewDBContext creates a new context with database query timeout
func NewDBContext() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 10*time.Second)
}

// HandleDBError handles database errors and writes appropriate response
func HandleDBError(w http.ResponseWriter, err error) bool {
	if errors.Is(err, context.DeadlineExceeded) {
		WriteError(w, http.StatusRequestTimeout, "Request timeout")
		return true
	}
	return false
}

