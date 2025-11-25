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

func InitDB() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL not found in environment variables")
	}

	dsn := convertMySQLURLToDSN(databaseURL)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("error opening database connection: %w", err)
	}

	DB.SetConnMaxLifetime(time.Hour)
	DB.SetConnMaxIdleTime(10 * time.Minute)
	DB.SetMaxOpenConns(50)
	DB.SetMaxIdleConns(10)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("✅ Database connection established successfully")
	return nil
}

func convertMySQLURLToDSN(url string) string {
	url = strings.TrimPrefix(url, "mysql://")

	lastAt := strings.LastIndex(url, "@")
	if lastAt == -1 {
		return url // Return as is if unable to parse
	}

	credentials := url[:lastAt]
	hostAndDB := url[lastAt+1:]

	hostParts := strings.Split(hostAndDB, "/")
	if len(hostParts) != 2 {
		return url
	}

	hostPort := hostParts[0]
	database := hostParts[1]

	database = strings.Split(database, "?")[0]

	return fmt.Sprintf("%s@tcp(%s)/%s", credentials, hostPort, database)
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

