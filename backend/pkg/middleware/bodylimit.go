package middleware

import (
	"net/http"
)

// MaxRequestBodySize limits request body size to prevent DoS attacks
const MaxRequestBodySize = 1024 * 1024 // 1MB

// BodyLimitMiddleware limits the size of request body
func BodyLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Limit request body size
		r.Body = http.MaxBytesReader(w, r.Body, MaxRequestBodySize)
		
		next.ServeHTTP(w, r)
	})
}

