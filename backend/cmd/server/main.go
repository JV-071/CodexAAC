package main

import (
	"log"
	"net/http"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/internal/handlers"
	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}

	// Check JWT_SECRET
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Println("⚠️  WARNING: JWT_SECRET is not configured. Using default key for development (NOT SAFE FOR PRODUCTION)")
		log.Println("   Configure JWT_SECRET in .env file for production")
	}

	// Initialize server configuration from config.lua
	serverConfigPath := os.Getenv("SERVER_CONFIG_PATH")
	if serverConfigPath != "" {
		if err := config.InitServerConfig(serverConfigPath); err != nil {
			log.Printf("⚠️  WARNING: Failed to load server config.lua: %v", err)
			log.Println("   Server configuration will use defaults")
		} else {
			log.Println("✅ Server configuration loaded successfully")
		}
	} else {
		log.Println("ℹ️  SERVER_CONFIG_PATH not set, server config will use defaults")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer database.CloseDB()

	// Create router
	r := mux.NewRouter()

	// Apply security middlewares
	r.Use(middleware.SecurityHeadersMiddleware)
	r.Use(middleware.BodyLimitMiddleware)

	// Public routes
	r.HandleFunc("/api/health", healthHandler).Methods("GET")
	r.HandleFunc("/api", homeHandler).Methods("GET")
	r.HandleFunc("/api/login", handlers.LoginHandler).Methods("POST")
	r.HandleFunc("/api/register", handlers.RegisterHandler).Methods("POST")
	r.HandleFunc("/api/logout", handlers.LogoutHandler).Methods("POST")
	r.HandleFunc("/api/server/config", handlers.GetServerConfigHandler).Methods("GET")

	// Protected routes (require authentication)
	protected := r.PathPrefix("/api").Subrouter()
	protected.Use(middleware.AuthMiddleware)
	
	// Account endpoints
	protected.HandleFunc("/account", handlers.GetAccountHandler).Methods("GET")
	protected.HandleFunc("/account", handlers.DeleteAccountHandler).Methods("DELETE")
	protected.HandleFunc("/account/cancel-deletion", handlers.CancelDeletionHandler).Methods("POST")
	
	// 2FA endpoints
	protected.HandleFunc("/account/2fa/status", handlers.Get2FAStatusHandler).Methods("GET")
	protected.HandleFunc("/account/2fa/enable", handlers.Enable2FAHandler).Methods("POST")
	protected.HandleFunc("/account/2fa/verify", handlers.Verify2FAHandler).Methods("POST")
	protected.HandleFunc("/account/2fa/disable", handlers.Disable2FAHandler).Methods("POST")
	
	// Character endpoints
	protected.HandleFunc("/characters", handlers.GetCharactersHandler).Methods("GET")
	protected.HandleFunc("/characters", handlers.CreateCharacterHandler).Methods("POST")
	
	// Public character details endpoint (anyone can view character info)
	r.HandleFunc("/api/characters/{name}", handlers.GetCharacterDetailsHandler).Methods("GET")

	// Configure server port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🌐 Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, middleware.CorsMiddleware(r)))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	// Check database connection
	dbStatus := "ok"
	statusCode := http.StatusOK
	if database.DB != nil {
		if err := database.DB.Ping(); err != nil {
			dbStatus = "error"
			statusCode = http.StatusServiceUnavailable
		}
	}

	message := "Server and database are running"
	if dbStatus == "error" {
		message = "Database is not accessible"
	}

	utils.WriteJSON(w, statusCode, Response{
		Message: message,
		Status:  dbStatus,
	})
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusOK, Response{
		Message: "Welcome to CodexAAC Backend",
		Status:  "ok",
	})
}




