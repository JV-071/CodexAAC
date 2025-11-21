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
	// CSP: Strict policy - removed unsafe-inline from scripts, kept only for styles (Next.js requirement)
	// - script-src: 'self' 'strict-dynamic' (no unsafe-inline - scripts must be from same origin or loaded by trusted scripts)
	// - style-src: 'self' 'unsafe-inline' (Next.js requires unsafe-inline for inline styles)
	// - img-src: 'self' data: blob: https: (allows local images, data URIs, blob URLs, and HTTPS images)
	// - font-src: 'self' data: (allows local fonts and data URIs)
	// - connect-src: 'self' http://localhost:* https: (allows API calls to same origin, localhost, and HTTPS)
	// - frame-ancestors 'none': Prevents embedding in iframes (more modern than X-Frame-Options)
	// - base-uri 'self': Prevents base tag injection
	// - form-action 'self': Prevents form submission to external URLs
	// - upgrade-insecure-requests: Automatically upgrades HTTP to HTTPS
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
		// Prevent MIME type sniffing
		w.Header().Set(headerXContentTypeOptions, valueXContentTypeOptions)
		
		// Prevent clickjacking
		w.Header().Set(headerXFrameOptions, valueXFrameOptions)
		
		// Enable browser XSS protection
		w.Header().Set(headerXXSSProtection, valueXXSSProtection)
		
		// Referrer Policy
		w.Header().Set(headerReferrerPolicy, valueReferrerPolicy)
		
		// Permissions Policy (formerly Feature-Policy)
		w.Header().Set(headerPermissionsPolicy, valuePermissionsPolicy)
		
		// Content Security Policy - helps prevent XSS attacks
		// Strict CSP without unsafe-inline or unsafe-eval for better security
		w.Header().Set(headerCSP, valueCSP)
		
		// If using HTTPS, add HSTS
		if r.TLS != nil {
			w.Header().Set(headerHSTS, valueHSTS)
		}
		
		next.ServeHTTP(w, r)
	})
}

