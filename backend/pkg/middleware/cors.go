package middleware

import (
	"net/http"
	"os"
	"strings"
	"sync"
)

var (
	allowedOriginsCache []string
	envCache            string
	corsCacheOnce       sync.Once
)

func initCorsCache() {
	allowedOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	envCache = os.Getenv("ENV")
	
	if allowedOriginsStr != "" {
		origins := strings.Split(allowedOriginsStr, ",")
		allowedOriginsCache = make([]string, 0, len(origins))
		for _, origin := range origins {
			allowedOriginsCache = append(allowedOriginsCache, strings.TrimSpace(origin))
		}
	}
}

func isOriginAllowed(origin string) bool {
	corsCacheOnce.Do(initCorsCache)
	
	if len(allowedOriginsCache) == 0 && (envCache == "development" || envCache == "") {
		return origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000"
	}
	
	for _, allowedOrigin := range allowedOriginsCache {
		if allowedOrigin == origin {
			return true
		}
	}
	return false
}

func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		if isOriginAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
