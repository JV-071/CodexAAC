package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/middleware"
	"codexaac-backend/pkg/utils"
	"github.com/gorilla/mux"
)

const (
	MaxNewsTitleLength   = 255
	MaxNewsContentLength = 10000
	MaxNewsLimit         = 100
	DefaultNewsLimit     = 10
)

type News struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	AuthorID    int    `json:"authorId"`
	CharacterID *int   `json:"characterId,omitempty"`
	Icon        string `json:"icon,omitempty"`
	Author      string `json:"author,omitempty"`
	CreatedAt   int64  `json:"createdAt"`
	UpdatedAt   int64  `json:"updatedAt"`
}

type CreateNewsRequest struct {
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	CharacterID *int    `json:"characterId,omitempty"`
	Icon        *string `json:"icon,omitempty"`
}

type UpdateNewsRequest struct {
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	CharacterID *int    `json:"characterId,omitempty"`
	Icon        *string `json:"icon,omitempty"`
}

type NewsComment struct {
	ID          int    `json:"id"`
	NewsID      int    `json:"newsId"`
	AuthorID    int    `json:"authorId"`
	CharacterID int    `json:"characterId"`
	CharacterName string `json:"characterName"`
	Content     string `json:"content"`
	CreatedAt   int64  `json:"createdAt"`
	// Outfit data
	LookType    int    `json:"lookType,omitempty"`
	LookHead    int    `json:"lookHead,omitempty"`
	LookBody    int    `json:"lookBody,omitempty"`
	LookLegs    int    `json:"lookLegs,omitempty"`
	LookFeet    int    `json:"lookFeet,omitempty"`
	LookAddons  int    `json:"lookAddons,omitempty"`
}

type CreateCommentRequest struct {
	NewsID      int    `json:"newsId"`
	CharacterID int    `json:"characterId"`
	Content     string `json:"content"`
}

func GetNewsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := utils.NewDBContext()
	defer cancel()

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := DefaultNewsLimit

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= MaxNewsLimit {
			limit = l
		}
	}

	offset := (page - 1) * limit

	query := `
		SELECT n.id, n.title, n.content, n.author_id, n.character_id, n.icon,
		       UNIX_TIMESTAMP(n.created_at) as created_at,
		       UNIX_TIMESTAMP(n.updated_at) as updated_at,
		       COALESCE(p.name, '') as author
		FROM news n
		LEFT JOIN players p ON p.id = n.character_id
		ORDER BY n.created_at DESC, n.id DESC
		LIMIT ? OFFSET ?
	`

	rows, err := database.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching news")
		return
	}
	defer rows.Close()

	newsList := make([]News, 0, limit)
	for rows.Next() {
		var news News
		var author sql.NullString
		var characterID sql.NullInt64
		var icon sql.NullString

		if err := rows.Scan(
			&news.ID,
			&news.Title,
			&news.Content,
			&news.AuthorID,
			&characterID,
			&icon,
			&news.CreatedAt,
			&news.UpdatedAt,
			&author,
		); err != nil {
			continue
		}

		if characterID.Valid {
			charID := int(characterID.Int64)
			news.CharacterID = &charID
		}

		if icon.Valid && icon.String != "" {
			news.Icon = icon.String
		} else {
			news.Icon = "📰"
		}

		if author.Valid && author.String != "" {
			news.Author = author.String
		}

		newsList = append(newsList, news)
	}

	var totalCount int
	countQuery := "SELECT COUNT(*) FROM news"
	err = database.DB.QueryRowContext(ctx, countQuery).Scan(&totalCount)
	if err != nil {
		totalCount = len(newsList)
	}

	response := map[string]interface{}{
		"news": newsList,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}

	utils.WriteSuccess(w, http.StatusOK, "News retrieved successfully", response)
}

func CreateNewsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req CreateNewsRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		if errors.Is(err, utils.ErrBodyTooLarge) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
		} else if errors.Is(err, utils.ErrInvalidContentType) {
			utils.WriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid request")
		}
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)

	if req.Title == "" {
		utils.WriteError(w, http.StatusBadRequest, "Title is required")
		return
	}

	if len(req.Title) > MaxNewsTitleLength {
		utils.WriteError(w, http.StatusBadRequest, "Title is too long (max "+strconv.Itoa(MaxNewsTitleLength)+" characters)")
		return
	}

	if req.Content == "" {
		utils.WriteError(w, http.StatusBadRequest, "Content is required")
		return
	}

	if len(req.Content) > MaxNewsContentLength {
		utils.WriteError(w, http.StatusBadRequest, "Content is too long (max "+strconv.Itoa(MaxNewsContentLength)+" characters)")
		return
	}

	// Sanitize content to prevent XSS
	req.Content = strings.ReplaceAll(req.Content, "<script", "&lt;script")
	req.Content = strings.ReplaceAll(req.Content, "</script>", "&lt;/script&gt;")

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Validate character_id belongs to user if provided
	if req.CharacterID != nil && *req.CharacterID > 0 {
		var belongsToUser bool
		err := database.DB.QueryRowContext(ctx,
			"SELECT COUNT(*) > 0 FROM players WHERE id = ? AND account_id = ?",
			*req.CharacterID, userID,
		).Scan(&belongsToUser)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Error validating character")
			return
		}
		if !belongsToUser {
			utils.WriteError(w, http.StatusForbidden, "Character does not belong to your account")
			return
		}
	}

	icon := "📰"
	if req.Icon != nil && *req.Icon != "" {
		icon = *req.Icon
	}

	query := `
		INSERT INTO news (title, content, author_id, character_id, icon)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := database.DB.ExecContext(ctx, query,
		req.Title,
		req.Content,
		userID,
		req.CharacterID,
		icon,
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error creating news")
		return
	}

	newsID, err := result.LastInsertId()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error getting news ID")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "News created successfully", map[string]interface{}{
		"id": int(newsID),
	})
}

func UpdateNewsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	newsIDStr := vars["id"]

	newsID, err := strconv.Atoi(newsIDStr)
	if err != nil || newsID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid news ID")
		return
	}

	var req UpdateNewsRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		if errors.Is(err, utils.ErrBodyTooLarge) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
		} else if errors.Is(err, utils.ErrInvalidContentType) {
			utils.WriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid request")
		}
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)

	if req.Title == "" {
		utils.WriteError(w, http.StatusBadRequest, "Title is required")
		return
	}

	if len(req.Title) > MaxNewsTitleLength {
		utils.WriteError(w, http.StatusBadRequest, "Title is too long (max "+strconv.Itoa(MaxNewsTitleLength)+" characters)")
		return
	}

	if req.Content == "" {
		utils.WriteError(w, http.StatusBadRequest, "Content is required")
		return
	}

	if len(req.Content) > MaxNewsContentLength {
		utils.WriteError(w, http.StatusBadRequest, "Content is too long (max "+strconv.Itoa(MaxNewsContentLength)+" characters)")
		return
	}

	// Sanitize content to prevent XSS
	req.Content = strings.ReplaceAll(req.Content, "<script", "&lt;script")
	req.Content = strings.ReplaceAll(req.Content, "</script>", "&lt;/script&gt;")

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Check if news exists
	var exists bool
	err = database.DB.QueryRowContext(ctx, "SELECT COUNT(*) > 0 FROM news WHERE id = ?", newsID).Scan(&exists)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking news")
		return
	}

	if !exists {
		utils.WriteError(w, http.StatusNotFound, "News not found")
		return
	}

	// Validate character_id belongs to user if provided
	if req.CharacterID != nil && *req.CharacterID > 0 {
		var belongsToUser bool
		err := database.DB.QueryRowContext(ctx,
			"SELECT COUNT(*) > 0 FROM players WHERE id = ? AND account_id = (SELECT author_id FROM news WHERE id = ?)",
			*req.CharacterID, newsID,
		).Scan(&belongsToUser)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Error validating character")
			return
		}
		if !belongsToUser {
			utils.WriteError(w, http.StatusForbidden, "Character does not belong to the news author")
			return
		}
	}

	icon := "📰"
	if req.Icon != nil && *req.Icon != "" {
		icon = *req.Icon
	}

	// Update news
	query := `
		UPDATE news
		SET title = ?, content = ?, character_id = ?, icon = ?
		WHERE id = ?
	`

	_, err = database.DB.ExecContext(ctx, query, req.Title, req.Content, req.CharacterID, icon, newsID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error updating news")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "News updated successfully", nil)
}

func DeleteNewsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	newsIDStr := vars["id"]

	newsID, err := strconv.Atoi(newsIDStr)
	if err != nil || newsID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid news ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	deleteQuery := "DELETE FROM news WHERE id = ?"
	result, err := database.DB.ExecContext(ctx, deleteQuery, newsID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error deleting news")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error checking deletion result")
		return
	}

	if rowsAffected == 0 {
		utils.WriteError(w, http.StatusNotFound, "News not found")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "News deleted successfully", nil)
}

func GetNewsDetailsHandler(w http.ResponseWriter, r *http.Request) {
	getNewsDetails(w, r)
}

func GetNewsDetailsPublicHandler(w http.ResponseWriter, r *http.Request) {
	getNewsDetails(w, r)
}

func getNewsDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	newsIDStr := vars["id"]

	newsID, err := strconv.Atoi(newsIDStr)
	if err != nil || newsID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid news ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var news News
	var author sql.NullString
	var characterID sql.NullInt64
	var icon sql.NullString

	err = database.DB.QueryRowContext(ctx,
		`SELECT n.id, n.title, n.content, n.author_id, n.character_id, n.icon,
		        UNIX_TIMESTAMP(n.created_at) as created_at,
		        UNIX_TIMESTAMP(n.updated_at) as updated_at,
		        COALESCE(p.name, '') as author
		 FROM news n
		 LEFT JOIN players p ON p.id = n.character_id
		 WHERE n.id = ?`,
		newsID,
	).Scan(
		&news.ID,
		&news.Title,
		&news.Content,
		&news.AuthorID,
		&characterID,
		&icon,
		&news.CreatedAt,
		&news.UpdatedAt,
		&author,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "News not found")
			return
		}
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching news")
		return
	}

	if characterID.Valid {
		charID := int(characterID.Int64)
		news.CharacterID = &charID
	}

	if icon.Valid && icon.String != "" {
		news.Icon = icon.String
	} else {
		news.Icon = "📰"
	}

	if author.Valid && author.String != "" {
		news.Author = author.String
	}

	utils.WriteSuccess(w, http.StatusOK, "News retrieved successfully", news)
}

// Comment handlers

func GetNewsCommentsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	newsIDStr := vars["id"]

	newsID, err := strconv.Atoi(newsIDStr)
	if err != nil || newsID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid news ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	query := `
		SELECT nc.id, nc.news_id, nc.author_id, nc.character_id, nc.content,
		       UNIX_TIMESTAMP(nc.created_at) as created_at,
		       p.name as character_name,
		       COALESCE(p.looktype, 128) as looktype,
		       COALESCE(p.lookhead, 0) as lookhead,
		       COALESCE(p.lookbody, 0) as lookbody,
		       COALESCE(p.looklegs, 0) as looklegs,
		       COALESCE(p.lookfeet, 0) as lookfeet,
		       COALESCE(p.lookaddons, 0) as lookaddons
		FROM news_comments nc
		INNER JOIN players p ON p.id = nc.character_id
		WHERE nc.news_id = ?
		ORDER BY nc.created_at ASC
	`

	rows, err := database.DB.QueryContext(ctx, query, newsID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error fetching comments")
		return
	}
	defer rows.Close()

	comments := make([]NewsComment, 0)
	for rows.Next() {
		var comment NewsComment

		if err := rows.Scan(
			&comment.ID,
			&comment.NewsID,
			&comment.AuthorID,
			&comment.CharacterID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.CharacterName,
			&comment.LookType,
			&comment.LookHead,
			&comment.LookBody,
			&comment.LookLegs,
			&comment.LookFeet,
			&comment.LookAddons,
		); err != nil {
			continue
		}

		comments = append(comments, comment)
	}

	utils.WriteSuccess(w, http.StatusOK, "Comments retrieved successfully", comments)
}

func CreateNewsCommentHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req CreateCommentRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		if errors.Is(err, utils.ErrBodyTooLarge) {
			utils.WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
		} else if errors.Is(err, utils.ErrInvalidContentType) {
			utils.WriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		} else {
			utils.WriteError(w, http.StatusBadRequest, "Invalid request")
		}
		return
	}

	req.Content = strings.TrimSpace(req.Content)

	if req.NewsID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "News ID is required")
		return
	}

	if req.CharacterID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Character ID is required")
		return
	}

	if req.Content == "" {
		utils.WriteError(w, http.StatusBadRequest, "Content is required")
		return
	}

	if len(req.Content) > 2000 {
		utils.WriteError(w, http.StatusBadRequest, "Content is too long (max 2000 characters)")
		return
	}

	// Sanitize content
	req.Content = strings.ReplaceAll(req.Content, "<script", "&lt;script")
	req.Content = strings.ReplaceAll(req.Content, "</script>", "&lt;/script&gt;")

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Validate character belongs to user
	var belongsToUser bool
	err := database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) > 0 FROM players WHERE id = ? AND account_id = ?",
		req.CharacterID, userID,
	).Scan(&belongsToUser)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error validating character")
		return
	}
	if !belongsToUser {
		utils.WriteError(w, http.StatusForbidden, "Character does not belong to your account")
		return
	}

	// Validate news exists
	var newsExists bool
	err = database.DB.QueryRowContext(ctx,
		"SELECT COUNT(*) > 0 FROM news WHERE id = ?",
		req.NewsID,
	).Scan(&newsExists)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error validating news")
		return
	}
	if !newsExists {
		utils.WriteError(w, http.StatusNotFound, "News not found")
		return
	}

	// Create comment
	query := `
		INSERT INTO news_comments (news_id, author_id, character_id, content)
		VALUES (?, ?, ?, ?)
	`

	result, err := database.DB.ExecContext(ctx, query,
		req.NewsID,
		userID,
		req.CharacterID,
		req.Content,
	)

	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error creating comment")
		return
	}

	commentID, err := result.LastInsertId()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error getting comment ID")
		return
	}

	utils.WriteSuccess(w, http.StatusCreated, "Comment created successfully", map[string]interface{}{
		"id": int(commentID),
	})
}

func DeleteNewsCommentHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	vars := mux.Vars(r)
	commentIDStr := vars["id"]

	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil || commentID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	// Check if user is admin or comment owner
	var isAdmin bool
	var commentAuthorID int
	err = database.DB.QueryRowContext(ctx,
		`SELECT nc.author_id, COALESCE(a.page_access, 0) = 1 as is_admin
		 FROM news_comments nc
		 INNER JOIN accounts a ON a.id = nc.author_id
		 WHERE nc.id = ?`,
		commentID,
	).Scan(&commentAuthorID, &isAdmin)

	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteError(w, http.StatusNotFound, "Comment not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error checking comment")
		return
	}

	// Only allow deletion if user is admin or comment owner
	if !isAdmin && commentAuthorID != userID {
		utils.WriteError(w, http.StatusForbidden, "You can only delete your own comments")
		return
	}

	deleteQuery := "DELETE FROM news_comments WHERE id = ?"
	result, err := database.DB.ExecContext(ctx, deleteQuery, commentID)
	if err != nil {
		if utils.HandleDBError(w, err) {
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Error deleting comment")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Error checking deletion result")
		return
	}

	if rowsAffected == 0 {
		utils.WriteError(w, http.StatusNotFound, "Comment not found")
		return
	}

	utils.WriteSuccess(w, http.StatusOK, "Comment deleted successfully", nil)
}

