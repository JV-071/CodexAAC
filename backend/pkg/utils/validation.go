package utils

import (
	"regexp"
	"strings"
)

// Compile regex once for better performance
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// IsValidEmail validates email format
func IsValidEmail(email string) bool {
	if email == "" || len(email) > 255 {
		return false
	}
	return emailRegex.MatchString(email)
}

// SanitizeString removes dangerous characters and limits size
func SanitizeString(input string, maxLength int) string {
	// Remove control characters and extra spaces
	input = strings.TrimSpace(input)
	
	// Limit size
	if len(input) > maxLength {
		input = input[:maxLength]
	}
	
	return input
}

// ValidatePassword validates password strength
func ValidatePassword(password string) (bool, string) {
	if len(password) < 6 {
		return false, "Password must be at least 6 characters"
	}
	
	if len(password) > 128 {
		return false, "Password must be at most 128 characters"
	}
	
	return true, ""
}

