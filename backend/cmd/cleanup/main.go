package main

import (
	"log"
	"os"

	"codexaac-backend/internal/database"
	"codexaac-backend/internal/jobs"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}

	if err := database.InitDB(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer database.CloseDB()

	jobs.RunCleanupJob()

	os.Exit(0)
}

