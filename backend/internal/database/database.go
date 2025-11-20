package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

// InitDB initializes the database connection
func InitDB() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL not found in environment variables")
	}

	// Convert DATABASE_URL from mysql:// format to Go DSN
	dsn := convertMySQLURLToDSN(databaseURL)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("error opening database connection: %w", err)
	}

	// Configure connection timeouts and limits
	// Maximum time a connection can be reused (1 hour)
	DB.SetConnMaxLifetime(time.Hour)
	
	// Maximum time a connection can be idle before being closed (10 minutes)
	DB.SetConnMaxIdleTime(10 * time.Minute)
	
	// Maximum number of open connections simultaneously
	DB.SetMaxOpenConns(25)
	
	// Maximum number of idle connections in the pool
	DB.SetMaxIdleConns(5)

	// Test connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("✅ Database connection established successfully")
	return nil
}

// convertMySQLURLToDSN converts MySQL URL to Go DSN
// mysql://user:password@host:port/database -> user:password@tcp(host:port)/database
func convertMySQLURLToDSN(url string) string {
	// Remove mysql:// prefix
	url = strings.TrimPrefix(url, "mysql://")

	// Find the last @ that separates credentials from host
	// This handles passwords that contain @
	lastAt := strings.LastIndex(url, "@")
	if lastAt == -1 {
		return url // Return as is if unable to parse
	}

	credentials := url[:lastAt]
	hostAndDB := url[lastAt+1:]

	// Separate host:port/database
	hostParts := strings.Split(hostAndDB, "/")
	if len(hostParts) != 2 {
		return url
	}

	hostPort := hostParts[0]
	database := hostParts[1]

	// Remove query params if present
	database = strings.Split(database, "?")[0]

	return fmt.Sprintf("%s@tcp(%s)/%s", credentials, hostPort, database)
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

