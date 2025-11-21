package jobs

import (
	"log"
	"strings"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/internal/handlers"
	"codexaac-backend/pkg/utils"
)

// CleanupDeletedAccounts removes accounts that have passed their deletion date
// This should be run periodically (e.g., daily via cron or scheduled task)
func CleanupDeletedAccounts() error {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Get current timestamp
	now := time.Now().Unix()

	// Find accounts that are pending deletion and past their deletion date
	query := `
		SELECT id, email 
		FROM accounts 
		WHERE status = ? 
		AND deletion_scheduled_at IS NOT NULL 
		AND deletion_scheduled_at <= ?
	`

	rows, err := database.DB.QueryContext(ctx, query, handlers.AccountStatusPendingDeletion, now)
	if err != nil {
		return err
	}
	defer rows.Close()

	var deletedCount int
	var accountIDs []int
	var emails []string

	for rows.Next() {
		var accountID int
		var email string
		if err := rows.Scan(&accountID, &email); err != nil {
			log.Printf("Error scanning account for deletion: %v", err)
			continue
		}
		accountIDs = append(accountIDs, accountID)
		emails = append(emails, email)
	}

	if err = rows.Err(); err != nil {
		return err
	}

	// Delete accounts (CASCADE will handle related records)
	if len(accountIDs) > 0 {
		// Build query with placeholders (optimized with strings.Builder)
		var builder strings.Builder
		args := make([]interface{}, len(accountIDs))
		for i, id := range accountIDs {
			if i > 0 {
				builder.WriteString(",")
			}
			builder.WriteString("?")
			args[i] = id
		}

		deleteQuery := "DELETE FROM accounts WHERE id IN (" + builder.String() + ")"
		result, err := database.DB.ExecContext(ctx, deleteQuery, args...)
		if err != nil {
			return err
		}

		rowsAffected, _ := result.RowsAffected()
		deletedCount = int(rowsAffected)

		log.Printf("✅ Cleaned up %d deleted accounts", deletedCount)
		for i, email := range emails {
			if i < len(accountIDs) {
				log.Printf("   - Deleted account ID %d (%s)", accountIDs[i], email)
			}
		}
	} else {
		log.Printf("ℹ️  No accounts to clean up")
	}

	return nil
}

// RunCleanupJob runs the cleanup job and can be called from a cron or scheduled task
func RunCleanupJob() {
	log.Println("🧹 Starting account cleanup job...")
	if err := CleanupDeletedAccounts(); err != nil {
		log.Printf("❌ Error running account cleanup job: %v", err)
	} else {
		log.Println("✅ Account cleanup job completed successfully")
	}
}

