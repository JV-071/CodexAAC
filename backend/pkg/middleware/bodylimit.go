package middleware

import (
	"net/http"
)

const MaxRequestBodySize = 1024 * 1024

func BodyLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, MaxRequestBodySize)
		
		next.ServeHTTP(w, r)
	})
}

