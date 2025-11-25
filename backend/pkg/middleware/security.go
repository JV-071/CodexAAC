package middleware

import (
	"net/http"
)

// Security header constants (defined once to avoid string allocation on each request)
const (
	headerXContentTypeOptions = "X-Content-Type-Options"
	headerXFrameOptions       = "X-Frame-Options"
	headerXXSSProtection      = "X-XSS-Protection"
	headerReferrerPolicy      = "Referrer-Policy"
	headerPermissionsPolicy   = "Permissions-Policy"
	headerCSP                 = "Content-Security-Policy"
	headerHSTS                = "Strict-Transport-Security"
	
	valueXContentTypeOptions = "nosniff"
	valueXFrameOptions       = "DENY"
	valueXXSSProtection      = "1; mode=block"
	valueReferrerPolicy      = "strict-origin-when-cross-origin"
	valuePermissionsPolicy   = "geolocation=(), microphone=(), camera=()"
	valueCSP = "default-src 'self'; " +
		"script-src 'self' 'strict-dynamic'; " +
		"style-src 'self' 'unsafe-inline'; " +
		"img-src 'self' data: blob: https:; " +
		"font-src 'self' data:; " +
		"connect-src 'self' http://localhost:* https:; " +
		"frame-ancestors 'none'; " +
		"base-uri 'self'; " +
		"form-action 'self'; " +
		"upgrade-insecure-requests"
	valueHSTS = "max-age=31536000; includeSubDomains"
)

// SecurityHeadersMiddleware adds HTTP security headers
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(headerXContentTypeOptions, valueXContentTypeOptions)
		w.Header().Set(headerXFrameOptions, valueXFrameOptions)
		w.Header().Set(headerXXSSProtection, valueXXSSProtection)
		w.Header().Set(headerReferrerPolicy, valueReferrerPolicy)
		w.Header().Set(headerPermissionsPolicy, valuePermissionsPolicy)
		w.Header().Set(headerCSP, valueCSP)
		
		if r.TLS != nil {
			w.Header().Set(headerHSTS, valueHSTS)
		}
		
		next.ServeHTTP(w, r)
	})
}

