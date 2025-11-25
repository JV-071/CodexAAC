package utils

import (
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
var nameRegex = regexp.MustCompile(`^[a-zA-Z\s]+$`)

func GetNameRegex() *regexp.Regexp {
	return nameRegex
}

func IsValidEmail(email string) bool {
	if email == "" || len(email) > 255 {
		return false
	}
	return emailRegex.MatchString(email)
}

func SanitizeString(input string, maxLength int) string {
	input = strings.TrimSpace(input)
	
	var builder strings.Builder
	for _, r := range input {
		if r >= 32 && r != '<' && r != '>' && r != '&' && r != '"' && r != '\'' && r != '/' && r != '\\' {
			builder.WriteRune(r)
		}
	}
	input = builder.String()
	
	if len(input) > maxLength {
		input = input[:maxLength]
	}
	
	return input
}

func ValidatePassword(password string) (bool, string) {
	if len(password) < 6 {
		return false, "Password must be at least 6 characters"
	}
	
	if len(password) > 128 {
		return false, "Password must be at most 128 characters"
	}
	
	return true, ""
}

