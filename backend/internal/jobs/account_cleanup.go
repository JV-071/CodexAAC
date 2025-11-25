package jobs

import (
	"log"
	"strings"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/internal/handlers"
	"codexaac-backend/pkg/utils"
)

func CleanupDeletedAccounts() error {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	now := time.Now().Unix()

	const selectBatchSize = 500
	const deleteBatchSize = 100

	var totalDeletedCount int
	offset := 0

	for {
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

		if len(accountIDs) == 0 {
			break
		}

		var deletedCount int
		
		for i := 0; i < len(accountIDs); i += deleteBatchSize {
			end := i + deleteBatchSize
			if end > len(accountIDs) {
				end = len(accountIDs)
			}
			
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}
			
			batch := accountIDs[i:end]
			
			validBatch := make([]int, 0, len(batch))
			for _, id := range batch {
				if id <= 0 {
					log.Printf("⚠️  Skipping invalid account ID: %d", id)
					continue
				}
				validBatch = append(validBatch, id)
			}
			
			if len(validBatch) == 0 {
				continue
			}
			
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
		
		if offset == 0 && deletedCount > 0 {
			log.Printf("🧹 Processing account cleanup batch (offset %d, deleted %d so far)...", offset, deletedCount)
		}

		offset += selectBatchSize
		
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

func RunCleanupJob() {
	log.Println("🧹 Starting account cleanup job...")
	if err := CleanupDeletedAccounts(); err != nil {
		log.Printf("❌ Error running account cleanup job: %v", err)
	} else {
		log.Println("✅ Account cleanup job completed successfully")
	}
}

