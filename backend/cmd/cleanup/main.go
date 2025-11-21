package main

import (
	"log"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/internal/jobs"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer database.CloseDB()

	// Run cleanup job
	jobs.RunCleanupJob()

	os.Exit(0)
}

