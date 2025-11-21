package twofactor

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

const (
	// SecretLength is the length of the Base32 secret (16 characters)
	SecretLength = 16
	// IssuerName is the name shown in authenticator apps
	IssuerName = "CodexAAC"
)

// GenerateSecret generates a random 16-character Base32 secret
func GenerateSecret() (string, error) {
	// Base32 alphabet: A-Z, 2-7
	alphabet := "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
	
	bytes := make([]byte, SecretLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	secret := make([]byte, SecretLength)
	for i := 0; i < SecretLength; i++ {
		secret[i] = alphabet[bytes[i]%byte(len(alphabet))]
	}

	return string(secret), nil
}

// ValidateToken validates a TOTP token against a secret
// Returns true if the token is valid, false otherwise
func ValidateToken(secret, token string) bool {
	if secret == "" || token == "" {
		return false
	}

	// Validate token with a 1-minute window (allows for clock skew)
	valid := totp.Validate(token, secret)
	return valid
}

// GenerateQRCode generates a QR code image for the given secret and account name
// Returns the QR code as PNG bytes
func GenerateQRCode(secret, accountName, serverName string) ([]byte, error) {
	// Generate otpauth URL
	url := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		serverName, accountName, secret, IssuerName)

	// Generate QR code
	qrCode, err := qrcode.New(url, qrcode.Medium)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	// Convert to PNG
	pngBytes, err := qrCode.PNG(256)
	if err != nil {
		return nil, fmt.Errorf("failed to encode QR code as PNG: %w", err)
	}

	return pngBytes, nil
}

// GenerateQRCodeDataURL generates a QR code and returns it as a data URL
// This is useful for embedding in HTML/JSON responses
func GenerateQRCodeDataURL(secret, accountName, serverName string) (string, error) {
	pngBytes, err := GenerateQRCode(secret, accountName, serverName)
	if err != nil {
		return "", err
	}

	// Encode as base64 data URL
	base64Str := base64.StdEncoding.EncodeToString(pngBytes)
	dataURL := fmt.Sprintf("data:image/png;base64,%s", base64Str)
	
	return dataURL, nil
}

// GenerateQRCodeBase64 generates a QR code and returns it as base64 string (without data URL prefix)
func GenerateQRCodeBase64(secret, accountName, serverName string) (string, error) {
	pngBytes, err := GenerateQRCode(secret, accountName, serverName)
	if err != nil {
		return "", err
	}

	// Encode as base64
	base64Str := base64.StdEncoding.EncodeToString(pngBytes)
	return base64Str, nil
}

// GenerateOTPAuthURL generates the otpauth:// URL for manual entry
func GenerateOTPAuthURL(secret, accountName, serverName string) string {
	return fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		serverName, accountName, secret, IssuerName)
}

