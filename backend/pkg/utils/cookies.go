package utils

import (
	"net/http"
	"time"
)

const (
	TokenCookieName = "auth_token"
	TokenCookieMaxAge = 24 * 60 * 60
)

func SetAuthCookie(w http.ResponseWriter, token string, isSecure bool) {
	cookie := &http.Cookie{
		Name:     TokenCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   TokenCookieMaxAge,
		HttpOnly: true,
		Secure:   isSecure,
	}
	
	if isSecure {
		cookie.SameSite = http.SameSiteNoneMode
	} else {
		cookie.SameSite = http.SameSiteLaxMode
	}
	
	http.SetCookie(w, cookie)
}

func ClearAuthCookie(w http.ResponseWriter, isSecure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     TokenCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetAuthCookie(r *http.Request) (string, error) {
	cookie, err := r.Cookie(TokenCookieName)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

