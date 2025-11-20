package utils

import (
	"crypto/sha1"
	"encoding/hex"
)

// HashSHA1 hashes a string using SHA1 (for Tibia compatibility)
func HashSHA1(input string) string {
	hasher := sha1.New()
	hasher.Write([]byte(input))
	return hex.EncodeToString(hasher.Sum(nil))
}

