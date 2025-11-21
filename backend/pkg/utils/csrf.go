package utils

import (
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"
)

// CSRF token storage (in-memory, can be moved to Redis in production)
type csrfToken struct {
	token      string
	userID     int
	expiresAt  time.Time
}

var (
	csrfTokens      = make(map[string]*csrfToken)
	csrfMutex       sync.RWMutex
	tokenTTL        = 30 * time.Minute // Token expires after 30 minutes
	cleanupStarted  sync.Once          // Ensures cleanup goroutine starts only once
	cleanupInterval = 5 * time.Minute  // Cleanup runs every 5 minutes
)

// init starts the background cleanup goroutine
func init() {
	startCleanupGoroutine()
}

// startCleanupGoroutine starts a background goroutine that periodically cleans up expired tokens
func startCleanupGoroutine() {
	cleanupStarted.Do(func() {
		go func() {
			ticker := time.NewTicker(cleanupInterval)
			defer ticker.Stop()
			
			for range ticker.C {
				cleanupExpiredTokens()
			}
		}()
	})
}

// GenerateCSRFToken generates a new CSRF token for a user
func GenerateCSRFToken(userID int) (string, error) {
	// Generate random token (32 bytes = 256 bits)
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", err
	}
	
	token := base64.URLEncoding.EncodeToString(tokenBytes)
	
	csrfMutex.Lock()
	defer csrfMutex.Unlock()
	
	// Note: Cleanup is now handled by background goroutine
	// Only do lazy cleanup if map is getting too large
	if len(csrfTokens) > 10000 {
		cleanupExpiredTokens()
	}
	
	// Store token
	csrfTokens[token] = &csrfToken{
		token:     token,
		userID:    userID,
		expiresAt: time.Now().Add(tokenTTL),
	}
	
	return token, nil
}

// ValidateCSRFToken validates a CSRF token for a user
func ValidateCSRFToken(token string, userID int) bool {
	csrfMutex.RLock()
	storedToken, exists := csrfTokens[token]
	csrfMutex.RUnlock()
	
	// Return early if token doesn't exist
	if !exists {
		return false
	}
	
	// Check if token expired (no need to lock for read-only check)
	now := time.Now()
	if now.After(storedToken.expiresAt) {
		// Token expired - remove it (requires write lock)
		csrfMutex.Lock()
		// Double-check it still exists and is expired (another goroutine might have removed it)
		if storedToken, stillExists := csrfTokens[token]; stillExists && now.After(storedToken.expiresAt) {
			delete(csrfTokens, token)
		}
		csrfMutex.Unlock()
		return false
	}
	
	// Check if token belongs to user
	return storedToken.userID == userID
}

// RevokeCSRFToken removes a CSRF token (useful for logout)
func RevokeCSRFToken(token string) {
	csrfMutex.Lock()
	defer csrfMutex.Unlock()
	
	delete(csrfTokens, token)
}

// RevokeAllUserTokens removes all CSRF tokens for a user
func RevokeAllUserTokens(userID int) {
	csrfMutex.Lock()
	defer csrfMutex.Unlock()
	
	for token, csrfToken := range csrfTokens {
		if csrfToken.userID == userID {
			delete(csrfTokens, token)
		}
	}
}

// cleanupExpiredTokens removes expired tokens (called internally by background goroutine)
func cleanupExpiredTokens() {
	csrfMutex.Lock()
	defer csrfMutex.Unlock()
	
	now := time.Now()
	expiredCount := 0
	for token, csrfToken := range csrfTokens {
		if now.After(csrfToken.expiresAt) {
			delete(csrfTokens, token)
			expiredCount++
		}
	}
	
	// Optional: log cleanup stats in development (can be removed in production)
	if expiredCount > 0 {
		// Uncomment for debugging:
		// log.Printf("🧹 Cleaned up %d expired CSRF tokens (remaining: %d)", expiredCount, len(csrfTokens))
	}
}

