package twofactor

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

const (
	SecretLength = 16
	IssuerName = "CodexAAC"
)

func GenerateSecret() (string, error) {
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

func ValidateToken(secret, token string) bool {
	if secret == "" || token == "" {
		return false
	}

	valid := totp.Validate(token, secret)
	return valid
}

func GenerateQRCode(secret, accountName, serverName string) ([]byte, error) {
	url := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		serverName, accountName, secret, IssuerName)

	qrCode, err := qrcode.New(url, qrcode.Medium)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	pngBytes, err := qrCode.PNG(256)
	if err != nil {
		return nil, fmt.Errorf("failed to encode QR code as PNG: %w", err)
	}

	return pngBytes, nil
}

func GenerateQRCodeDataURL(secret, accountName, serverName string) (string, error) {
	pngBytes, err := GenerateQRCode(secret, accountName, serverName)
	if err != nil {
		return "", err
	}

	base64Str := base64.StdEncoding.EncodeToString(pngBytes)
	dataURL := fmt.Sprintf("data:image/png;base64,%s", base64Str)
	
	return dataURL, nil
}

func GenerateQRCodeBase64(secret, accountName, serverName string) (string, error) {
	pngBytes, err := GenerateQRCode(secret, accountName, serverName)
	if err != nil {
		return "", err
	}

	base64Str := base64.StdEncoding.EncodeToString(pngBytes)
	return base64Str, nil
}

func GenerateOTPAuthURL(secret, accountName, serverName string) string {
	return fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		serverName, accountName, secret, IssuerName)
}

