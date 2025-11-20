package tls

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

// TLSConfig holds TLS configuration
type TLSConfig struct {
	Enabled    bool
	CertFile   string
	KeyFile    string
	MinVersion uint16
}

// LoadTLSConfig loads TLS configuration from environment variables
func LoadTLSConfig() *TLSConfig {
	env := strings.ToLower(os.Getenv("ENV"))
	
	// In development, HTTPS is optional
	if env == "development" {
		return &TLSConfig{
			Enabled: os.Getenv("HTTPS_ENABLED") == "true",
		}
	}
	
	// In production, HTTPS is enabled by default
	config := &TLSConfig{
		Enabled:    os.Getenv("HTTPS_ENABLED") != "false",
		CertFile:   os.Getenv("TLS_CERT_FILE"),
		KeyFile:    os.Getenv("TLS_KEY_FILE"),
		MinVersion: tls.VersionTLS12, // Minimum TLS 1.2
	}
	
	return config
}

// GetTLSConfig returns TLS configuration for the server using provided certificate files
func GetTLSConfig(config *TLSConfig) (*tls.Config, error) {
	if !config.Enabled {
		return nil, nil
	}
	
	// Use provided certificate files (from certbot/nginx/etc)
	if config.CertFile == "" || config.KeyFile == "" {
		return nil, fmt.Errorf("TLS enabled but TLS_CERT_FILE or TLS_KEY_FILE is not set. Provide certificate files from certbot or other source")
	}
	
	cert, err := tls.LoadX509KeyPair(config.CertFile, config.KeyFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load certificate: %w", err)
	}
	
	log.Println("✅ Using TLS certificate files")
	log.Printf("   Certificate: %s", config.CertFile)
	log.Printf("   Private Key: %s", config.KeyFile)
	
	return &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   config.MinVersion,
	}, nil
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Server     *http.Server
	TLSEnabled bool
}

// GetServer returns configured HTTP server with TLS support
func GetServer(handler http.Handler, config *TLSConfig) (*ServerConfig, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	// If HTTPS is enabled, use port 443 by default
	if config.Enabled && port == "8080" {
		port = "443"
	}
	
	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}
	
	// Configure TLS if enabled
	if config.Enabled {
		tlsConfig, err := GetTLSConfig(config)
		if err != nil {
			return nil, err
		}
		server.TLSConfig = tlsConfig
	}
	
	return &ServerConfig{
		Server:     server,
		TLSEnabled: config.Enabled,
	}, nil
}

// StartServer starts the HTTP/HTTPS server
func StartServer(serverConfig *ServerConfig, config *TLSConfig) error {
	if serverConfig.TLSEnabled {
		log.Printf("🔒 Server starting with HTTPS on port %s", serverConfig.Server.Addr)
		// Use empty strings to load certificates from TLSConfig
		return serverConfig.Server.ListenAndServeTLS("", "")
	}
	
	log.Printf("🌐 Server starting with HTTP on port %s", serverConfig.Server.Addr)
	log.Println("⚠️  WARNING: Running without HTTPS. Not recommended for production!")
	return serverConfig.Server.ListenAndServe()
}

