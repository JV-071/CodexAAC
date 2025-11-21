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

	// Process accounts in chunks to avoid loading too many into memory
	const selectBatchSize = 500 // Fetch 500 at a time from database
	const deleteBatchSize = 100 // Delete 100 at a time for optimal performance

	var totalDeletedCount int
	offset := 0

	for {
		// Find accounts that are pending deletion and past their deletion date
		// Use LIMIT and OFFSET for pagination to avoid loading all into memory
		query := `
			SELECT id, email 
			FROM accounts 
			WHERE status = ? 
			AND deletion_scheduled_at IS NOT NULL 
			AND deletion_scheduled_at <= ?
			ORDER BY id
			LIMIT ? OFFSET ?
		`

		rows, err := database.DB.QueryContext(ctx, query, handlers.AccountStatusPendingDeletion, now, selectBatchSize, offset)
		if err != nil {
			return err
		}

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
		rows.Close()

		if err = rows.Err(); err != nil {
			return err
		}

		// If no more accounts, break the loop
		if len(accountIDs) == 0 {
			break
		}

		// Delete accounts (CASCADE will handle related records)
		// Use batch deletion with prepared statements for security and efficiency
		var deletedCount int
		
		for i := 0; i < len(accountIDs); i += deleteBatchSize {
			end := i + deleteBatchSize
			if end > len(accountIDs) {
				end = len(accountIDs)
			}
			
			// Check context cancellation (important for long-running operations)
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}
			
			batch := accountIDs[i:end]
			
			// Filter out invalid IDs before building query
			validBatch := make([]int, 0, len(batch))
			for _, id := range batch {
				// Validate ID is positive (additional safety check)
				if id <= 0 {
					log.Printf("⚠️  Skipping invalid account ID: %d", id)
					continue
				}
				validBatch = append(validBatch, id)
			}
			
			if len(validBatch) == 0 {
				continue // Skip empty batches
			}
			
			// Build query with placeholders using strings.Builder
			// All values are passed as parameters (prepared statement)
			var builder strings.Builder
			builder.WriteString("DELETE FROM accounts WHERE id IN (")
			
			args := make([]interface{}, len(validBatch))
			for j, id := range validBatch {
				if j > 0 {
					builder.WriteString(",")
				}
				builder.WriteString("?")
				args[j] = id
			}
			builder.WriteString(")")

			// Execute with prepared statement (all values are placeholders, no string interpolation)
			deleteQuery := builder.String()
			result, err := database.DB.ExecContext(ctx, deleteQuery, args...)
			if err != nil {
				log.Printf("Error deleting batch starting at index %d: %v", i, err)
				return err
			}

			rowsAffected, _ := result.RowsAffected()
			deletedCount += int(rowsAffected)
		}

		totalDeletedCount += deletedCount
		
		// Log batch progress (only log first few and summary to avoid spam)
		if offset == 0 && deletedCount > 0 {
			log.Printf("🧹 Processing account cleanup batch (offset %d, deleted %d so far)...", offset, deletedCount)
		}

		// Move to next batch
		offset += selectBatchSize
		
		// If we got fewer results than batch size, we're done
		if len(accountIDs) < selectBatchSize {
			break
		}
	}

	if totalDeletedCount > 0 {
		log.Printf("✅ Cleaned up %d deleted accounts total", totalDeletedCount)
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

