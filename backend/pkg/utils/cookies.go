package utils

import (
	"net/http"
	"time"
)

const (
	// TokenCookieName is the name of the JWT token cookie
	TokenCookieName = "auth_token"
	// TokenCookieMaxAge is the maximum age of the token cookie in seconds (24 hours)
	TokenCookieMaxAge = 24 * 60 * 60
)

// SetAuthCookie sets an httpOnly, secure cookie with the JWT token
func SetAuthCookie(w http.ResponseWriter, token string, isSecure bool) {
	cookie := &http.Cookie{
		Name:     TokenCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   TokenCookieMaxAge,
		HttpOnly: true, // Prevents JavaScript access (XSS protection)
		Secure:   isSecure, // Only send over HTTPS in production
		SameSite: http.SameSiteNoneMode, // Allow cross-site cookies (needed for different ports in dev)
	}
	
	// In development (non-secure), use SameSite Lax to allow localhost cross-port
	if !isSecure {
		cookie.SameSite = http.SameSiteLaxMode
	}
	
	http.SetCookie(w, cookie)
}

// ClearAuthCookie clears the authentication cookie
func ClearAuthCookie(w http.ResponseWriter, isSecure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     TokenCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // Delete immediately
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

// GetAuthCookie retrieves the JWT token from the cookie
func GetAuthCookie(r *http.Request) (string, error) {
	cookie, err := r.Cookie(TokenCookieName)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

