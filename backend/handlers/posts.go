package handlers

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
)

// GetPosts (Public)
func GetPosts(c *fiber.Ctx) error {
	var posts []models.Post
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	db := database.DB.Select("posts.id, posts.title, posts.slug, posts.description, posts.cover_image, posts.is_published, posts.view_count, posts.created_at, posts.updated_at, posts.user_id").
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
// GetPost (Public, by Slug)
func GetPost(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var post models.Post
	if err := database.DB.Where("slug = ?", slug).Preload("Comments.Replies").Preload("Categories").First(&post).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	// Increment view count
	post.ViewCount++
	database.DB.Save(&post)
    
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

    // Convert to map to inject counts
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
        "reaction_counts": counts, // Inject here
    }

	return c.JSON(postMap)
}

// GetPostByID (Protected/Admin)
func GetPostByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var post models.Post
	// Preload categories for admin edit
	if err := database.DB.Preload("Categories").First(&post, id).Error; err != nil {
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

	if err := database.DB.Create(&post).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create post"})
	}
    
    // Assign Categories if provided
    if len(post.CategoryIDs) > 0 {
        var categories []models.Category
        database.DB.Where("id IN ?", post.CategoryIDs).Find(&categories)
        database.DB.Model(&post).Association("Categories").Replace(categories)
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

    // Update Categories
	if updateData.CategoryIDs != nil { // empty slice means clear tags, nil means don't touch
        var categories []models.Category
        if len(updateData.CategoryIDs) > 0 {
             database.DB.Where("id IN ?", updateData.CategoryIDs).Find(&categories)
        }
        database.DB.Model(&post).Association("Categories").Replace(categories)
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

// GetRecommendedPosts (Public)
func GetRecommendedPosts(c *fiber.Ctx) error {
	limit := 6 // Need 3-6 for generic UI
	var finalPosts []models.Post
	seenIDs := make(map[uint]bool)

	// Helper to add posts if not exists
	addPosts := func(posts []models.Post) {
		for _, p := range posts {
			if len(finalPosts) >= limit {
				return
			}
			if !seenIDs[p.ID] {
				finalPosts = append(finalPosts, p)
				seenIDs[p.ID] = true
			}
		}
	}

	// 1. Top Reacted
	var topReacted []models.Post
	database.DB.Preload("User").
		Table("posts").
		Select("posts.*, count(reactions.id) as reaction_count").
		Joins("LEFT JOIN reactions ON reactions.post_id = posts.id").
		Where("posts.is_published = ?", true).
		Group("posts.id").
		Order("reaction_count DESC").
		Limit(limit).
		Find(&topReacted)
	addPosts(topReacted)

	// 2. Top Commented (if needed)
	if len(finalPosts) < limit {
		var topCommented []models.Post
		database.DB.Preload("User").
			Table("posts").
			Select("posts.*, count(comments.id) as comment_count").
			Joins("LEFT JOIN comments ON comments.post_id = posts.id").
			Where("posts.is_published = ?", true).
			Group("posts.id").
			Order("comment_count DESC").
			Limit(limit).
			Find(&topCommented)
		addPosts(topCommented)
	}

	// 3. Top Viewed (if needed)
	if len(finalPosts) < limit {
		var topViewed []models.Post
		database.DB.Preload("User").
			Where("is_published = ?", true).
			Order("view_count DESC").
			Limit(limit).
			Find(&topViewed)
		addPosts(topViewed)
	}
    
    // 4. Fallback latest (if absolutely needed)
    if len(finalPosts) < limit {
         var latest []models.Post
         database.DB.Preload("User").
            Where("is_published = ?", true).
            Order("created_at DESC").
            Limit(limit).
            Find(&latest)
         addPosts(latest)
    }

	return c.JSON(finalPosts)
}

