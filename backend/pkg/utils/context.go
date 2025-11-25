package utils

import (
	"context"
	"errors"
	"net/http"
	"time"
)

func NewDBContext() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 10*time.Second)
}

func HandleDBError(w http.ResponseWriter, err error) bool {
	if errors.Is(err, context.DeadlineExceeded) {
		WriteError(w, http.StatusRequestTimeout, "Request timeout")
		return true
	}
	return false
}

