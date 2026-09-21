package handlers

import (
	"math"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"gorm.io/gorm"
)

func localizePost(post *models.Post, requestedLang string) {
	locales := []string{"vi"}
	for _, t := range post.Translations {
		if t.Locale != "" && t.Locale != "vi" {
			locales = append(locales, t.Locale)
		}
	}
	post.AvailableLocales = locales

	// Target language resolution:
	// 1. Explicit query parameter `requestedLang` (if user explicitly requested ?lang=...)
	// 2. Otherwise, use the author's configured priority `post.DefaultLocale` (e.g. "ja" or "vi")
	targetLang := requestedLang
	if targetLang == "" {
		if post.DefaultLocale != "" {
			targetLang = post.DefaultLocale
		} else {
			targetLang = "vi"
		}
	}

	if targetLang != "" && targetLang != "vi" {
		for _, t := range post.Translations {
			if strings.EqualFold(t.Locale, targetLang) {
				if t.Title != "" {
					post.Title = t.Title
				}
				if t.Description != "" {
					post.Description = t.Description
				}
				if t.Content != "" {
					post.Content = t.Content
				}
				post.ActiveLocale = t.Locale
				return
			}
		}
	}
	post.ActiveLocale = "vi"
}

// GetPosts (Public)
func GetPosts(c *fiber.Ctx) error {
	var posts []models.Post
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit
	lang := c.Query("lang", "")

	db := database.DB.Select("posts.id, posts.title, posts.slug, posts.description, posts.cover_image, posts.is_published, posts.view_count, posts.created_at, posts.updated_at, posts.user_id, posts.default_locale").
		Preload("Translations").
		Preload("User").
		Preload("Categories").
		Where("posts.is_published = ?", true)

	// Category Filter (Slug or ID)
	if catParam := c.Query("category"); catParam != "" {
		db = db.Joins("JOIN post_categories ON post_categories.post_id = posts.id").
			Joins("JOIN categories ON categories.id = post_categories.category_id").
			Where("categories.slug = ? OR categories.id::text = ?", catParam, catParam)
	}

    // Search Filter
    if search := c.Query("search"); search != "" {
        searchPattern := "%" + search + "%"
        db = db.Where("title ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
    }

	if err := db.Offset(offset).Limit(limit).Order("posts.created_at desc").Find(&posts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch posts"})
	}

	for i := range posts {
		localizePost(&posts[i], lang)
	}

	var total int64
	countDB := database.DB.Model(&models.Post{}).Where("is_published = ?", true)
	if catParam := c.Query("category"); catParam != "" {
		countDB = countDB.Joins("JOIN post_categories ON post_categories.post_id = posts.id").
			Joins("JOIN categories ON categories.id = post_categories.category_id").
			Where("categories.slug = ? OR categories.id::text = ?", catParam, catParam)
	}
    if search := c.Query("search"); search != "" {
        searchPattern := "%" + search + "%"
        countDB = countDB.Where("title ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
    }
	countDB.Count(&total)

	return c.JSON(fiber.Map{
		"data":  posts,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"last_page": int(total)/limit + 1,
		},
	})
}

// GetPost (Public, by Slug)
func GetPost(c *fiber.Ctx) error {
	slug := c.Params("slug")
	lang := c.Query("lang", "")
	var post models.Post
	if err := database.DB.Where("slug = ?", slug).
		Preload("Translations").
		Preload("Categories").
		Take(&post).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	// Increment view count asynchronously in background (atomic integer update)
	// avoiding expensive full-row rewrite with large HTML/Base64 content
	post.ViewCount++
	go func(postID uint) {
		database.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	}(post.ID)

	localizePost(&post, lang)
    
    // Get Reaction Counts
    var results []struct {
		Type  string
		Count int64
	}
	database.DB.Model(&models.Reaction{}).
		Where("post_id = ?", post.ID).
		Select("type, count(*) as count").
		Group("type").
		Scan(&results)

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Type] = r.Count
	}

    // Convert to map to inject counts and multilingual data
    postMap := fiber.Map{
        "id": post.ID,
        "title": post.Title,
        "slug": post.Slug,
        "content": post.Content,
        "description": post.Description,
        "cover_image": post.CoverImage,
        "created_at": post.CreatedAt,
        "updated_at": post.UpdatedAt,
        "view_count": post.ViewCount,
        "categories": post.Categories,
        "reaction_counts": counts,
        "default_locale": post.DefaultLocale,
        "active_locale": post.ActiveLocale,
        "available_locales": post.AvailableLocales,
        "translations": post.Translations,
    }

	return c.JSON(postMap)
}

// GetPostByID (Protected/Admin)
func GetPostByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var post models.Post
	// Preload categories and translations for admin edit
	if err := database.DB.Preload("Categories").Preload("Translations").First(&post, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}
    // Fill CategoryIDs for frontend convenience
    for _, cat := range post.Categories {
        post.CategoryIDs = append(post.CategoryIDs, cat.ID)
    }
	return c.JSON(post)
}

// CreatePost (Protected)
func CreatePost(c *fiber.Ctx) error {
	var post models.Post
	if err := c.BodyParser(&post); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Generate Slug if empty
	if post.Slug == "" {
		post.Slug = strings.ReplaceAll(strings.ToLower(post.Title), " ", "-")
	}

	// Assign UserID from context (set by Protected middleware)
	userID := c.Locals("user_id").(float64) // JWT claims are float64 by default
	post.UserID = uint(userID)
	if post.DefaultLocale == "" {
		post.DefaultLocale = "vi"
	}

	translations := post.Translations
	post.Translations = nil

	if err := database.DB.Create(&post).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create post"})
	}
    
    // Assign Categories if provided
    if len(post.CategoryIDs) > 0 {
        var categories []models.Category
        database.DB.Where("id IN ?", post.CategoryIDs).Find(&categories)
        database.DB.Model(&post).Association("Categories").Replace(categories)
    }

	// Save Translations if provided
	if len(translations) > 0 {
		for _, t := range translations {
			if strings.TrimSpace(t.Title) != "" || strings.TrimSpace(t.Content) != "" {
				t.PostID = post.ID
				database.DB.Create(&t)
			}
		}
	}

	return c.JSON(post)
}

// UpdatePost (Protected)
func UpdatePost(c *fiber.Ctx) error {
	id := c.Params("id")
	var post models.Post
	if err := database.DB.First(&post, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	var updateData models.Post
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	database.DB.Model(&post).Updates(updateData)

	if updateData.DefaultLocale != "" {
		post.DefaultLocale = updateData.DefaultLocale
		database.DB.Model(&post).Update("default_locale", updateData.DefaultLocale)
	}

    // Update Categories
	if updateData.CategoryIDs != nil { // empty slice means clear tags, nil means don't touch
        var categories []models.Category
        if len(updateData.CategoryIDs) > 0 {
             database.DB.Where("id IN ?", updateData.CategoryIDs).Find(&categories)
        }
        database.DB.Model(&post).Association("Categories").Replace(categories)
    }

	// Update Translations
	if updateData.Translations != nil {
		database.DB.Where("post_id = ?", post.ID).Delete(&models.PostTranslation{})
		for _, t := range updateData.Translations {
			if strings.TrimSpace(t.Title) != "" || strings.TrimSpace(t.Content) != "" {
				t.ID = 0
				t.PostID = post.ID
				database.DB.Create(&t)
			}
		}
	}

	return c.JSON(post)
}

// DeletePost (Protected)
func DeletePost(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.Post{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete post"})
	}
	return c.JSON(fiber.Map{"message": "Post deleted result"})
}

// Stop words for keyword extraction
var commonStopWords = map[string]bool{
	"la": true, "va": true, "cac": true, "trong": true, "cua": true, "cho": true,
	"voi": true, "ve": true, "mot": true, "nhung": true, "duoc": true, "nay": true,
	"the": true, "a": true, "an": true, "of": true, "in": true, "to": true, "for": true,
	"with": true, "on": true, "at": true, "by": true, "from": true, "and": true, "or": true,
	"is": true, "are": true, "how": true,
}

func extractKeywords(text string) map[string]bool {
	text = strings.ToLower(text)
	var sb strings.Builder
	for _, r := range text {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			sb.WriteRune(r)
		} else {
			sb.WriteRune(' ')
		}
	}
	words := strings.Fields(sb.String())
	keywords := make(map[string]bool)
	for _, w := range words {
		if len(w) >= 3 && !commonStopWords[w] {
			keywords[w] = true
		}
	}
	return keywords
}

type ScoredPost struct {
	Post  models.Post
	Score float64
}

// GetRecommendedPosts (Public - Smart Multi-Factor Recommendation Algorithm)
func GetRecommendedPosts(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "4"))
	if limit <= 0 || limit > 12 {
		limit = 4
	}

	lang := c.Query("lang", "")
	currentSlug := strings.TrimSpace(c.Query("current_slug"))
	currentID, _ := strconv.Atoi(c.Query("post_id", "0"))

	var currentPost models.Post
	hasCurrentPost := false

	if currentSlug != "" {
		if err := database.DB.Where("slug = ?", currentSlug).Preload("Translations").Preload("Categories").First(&currentPost).Error; err == nil {
			hasCurrentPost = true
		}
	} else if currentID > 0 {
		if err := database.DB.Where("id = ?", currentID).Preload("Translations").Preload("Categories").First(&currentPost).Error; err == nil {
			hasCurrentPost = true
		}
	}

	// Fast path for home page / general recommendations (no current post provided)
	if !hasCurrentPost {
		var topPosts []models.Post
		if err := database.DB.Select("posts.id, posts.title, posts.slug, posts.description, posts.cover_image, posts.is_published, posts.view_count, posts.created_at, posts.updated_at, posts.user_id, posts.default_locale").
			Preload("Translations").
			Preload("Categories").
			Where("posts.is_published = ?", true).
			Order("posts.view_count desc").
			Limit(limit).
			Find(&topPosts).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch top posts"})
		}
		for i := range topPosts {
			localizePost(&topPosts[i], lang)
		}
		return c.JSON(topPosts)
	}

	// Fetch candidate published posts for smart content recommendation (excluding current post and excluding heavy content column)
	var candidatePosts []models.Post
	query := database.DB.Select("posts.id, posts.title, posts.slug, posts.description, posts.cover_image, posts.is_published, posts.view_count, posts.created_at, posts.updated_at, posts.user_id, posts.default_locale").
		Preload("Translations").
		Preload("Categories").
		Preload("User").
		Where("posts.is_published = ? AND posts.id != ?", true, currentPost.ID)

	if err := query.Find(&candidatePosts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch candidate posts"})
	}

	if len(candidatePosts) == 0 {
		return c.JSON([]models.Post{})
	}

	currentKeywords := extractKeywords(currentPost.Title + " " + currentPost.Description)
	currentCatMap := make(map[uint]bool)
	for _, cat := range currentPost.Categories {
		currentCatMap[cat.ID] = true
	}

	scoredList := make([]ScoredPost, 0, len(candidatePosts))

	for _, cand := range candidatePosts {
		// Factor 1: Category Overlap (Weight: 50%)
		catMatches := 0
		for _, cat := range cand.Categories {
			if currentCatMap[cat.ID] {
				catMatches++
			}
		}
		catScore := float64(catMatches) * 25.0
		if catScore > 50.0 {
			catScore = 50.0
		}

		// Factor 2: Title & Description Keyword Overlap (Weight: 30%)
		candKeywords := extractKeywords(cand.Title + " " + cand.Description)
		intersection := 0
		for kw := range currentKeywords {
			if candKeywords[kw] {
				intersection++
			}
		}
		union := len(currentKeywords) + len(candKeywords) - intersection
		keywordScore := 0.0
		if union > 0 {
			keywordScore = (float64(intersection) / float64(union)) * 25.0
		}
		if intersection > 0 {
			keywordScore += float64(intersection) * 2.5
		}
		if keywordScore > 30.0 {
			keywordScore = 30.0
		}

		// Factor 3: Popularity Signal (Weight: 10%)
		popularityScore := math.Log10(float64(cand.ViewCount+1)) * 3.0
		if popularityScore > 10.0 {
			popularityScore = 10.0
		}

		// Factor 4: Recency Signal (Weight: 10%)
		daysAgo := time.Since(cand.CreatedAt).Hours() / 24.0
		recencyScore := 10.0 / (1.0 + daysAgo/60.0)

		totalScore := catScore + keywordScore + popularityScore + recencyScore
		scoredList = append(scoredList, ScoredPost{
			Post:  cand,
			Score: totalScore,
		})
	}

	// Sort candidates by totalScore descending
	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].Score > scoredList[j].Score
	})

	finalPosts := make([]models.Post, 0, limit)
	for i := 0; i < len(scoredList) && i < limit; i++ {
		post := scoredList[i].Post
		localizePost(&post, lang)
		finalPosts = append(finalPosts, post)
	}

	return c.JSON(finalPosts)
}

// GetAdminPosts (Protected - Lists all posts including drafts with filter & sort)
func GetAdminPosts(c *fiber.Ctx) error {
	var posts []models.Post
	db := database.DB.Model(&models.Post{}).
		Preload("Translations").
		Preload("Categories").
		Preload("User")

	// Status filter: all (default), published, draft
	status := c.Query("status", "all")
	if status == "published" {
		db = db.Where("posts.is_published = ?", true)
	} else if status == "draft" {
		db = db.Where("posts.is_published = ?", false)
	}

	// Category filter (slug or id)
	if catParam := c.Query("category"); catParam != "" {
		db = db.Joins("JOIN post_categories ON post_categories.post_id = posts.id").
			Joins("JOIN categories ON categories.id = post_categories.category_id").
			Where("categories.slug = ? OR categories.id::text = ?", catParam, catParam)
	}

	// Search filter
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		searchPattern := "%" + search + "%"
		db = db.Where("posts.title ILIKE ? OR posts.description ILIKE ? OR posts.slug ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// Sorting
	sort := c.Query("sort", "newest")
	switch sort {
	case "oldest":
		db = db.Order("posts.created_at asc")
	case "views_desc":
		db = db.Order("posts.view_count desc, posts.created_at desc")
	case "views_asc":
		db = db.Order("posts.view_count asc, posts.created_at desc")
	case "title_asc":
		db = db.Order("posts.title asc")
	case "title_desc":
		db = db.Order("posts.title desc")
	case "updated":
		db = db.Order("posts.updated_at desc")
	default:
		db = db.Order("posts.created_at desc")
	}

	if err := db.Find(&posts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch admin posts"})
	}

	for i := range posts {
		locales := []string{"vi"}
		for _, t := range posts[i].Translations {
			if t.Locale != "" && t.Locale != "vi" {
				locales = append(locales, t.Locale)
			}
		}
		posts[i].AvailableLocales = locales
	}

	return c.JSON(fiber.Map{
		"data":  posts,
		"total": len(posts),
	})
}

// TogglePublishPost (Protected - Fast toggle between draft and published)
func TogglePublishPost(c *fiber.Ctx) error {
	id := c.Params("id")
	var post models.Post
	if err := database.DB.First(&post, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	post.IsPublished = !post.IsPublished
	if err := database.DB.Save(&post).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update post status"})
	}

	return c.JSON(fiber.Map{
		"message":      "Post status updated successfully",
		"id":           post.ID,
		"is_published": post.IsPublished,
	})
}

