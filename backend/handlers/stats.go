package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
)

type CategoryStat struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	PostCount int64  `json:"post_count"`
}

type TopPostStat struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	ViewCount   int64  `json:"view_count"`
	IsPublished bool   `json:"is_published"`
}

func GetAdminStats(c *fiber.Ctx) error {
	var totalPosts int64
	var publishedPosts int64
	var draftPosts int64
	var totalViews int64
	var totalCategories int64
	var totalComments int64
	var totalReactions int64

	// Post counts
	database.DB.Model(&models.Post{}).Count(&totalPosts)
	database.DB.Model(&models.Post{}).Where("is_published = ?", true).Count(&publishedPosts)
	database.DB.Model(&models.Post{}).Where("is_published = ?", false).Count(&draftPosts)

	// Total views
	database.DB.Model(&models.Post{}).Select("COALESCE(SUM(view_count), 0)").Scan(&totalViews)

	// Categories, comments, reactions
	database.DB.Model(&models.Category{}).Count(&totalCategories)
	database.DB.Model(&models.Comment{}).Count(&totalComments)
	database.DB.Model(&models.Reaction{}).Count(&totalReactions)

	// Top 5 viewed posts
	var topPosts []TopPostStat
	database.DB.Model(&models.Post{}).
		Select("id, title, slug, view_count, is_published").
		Order("view_count desc").
		Limit(5).
		Scan(&topPosts)

	// Categories with post counts
	var categories []models.Category
	database.DB.Find(&categories)

	categoryStats := make([]CategoryStat, 0, len(categories))
	for _, cat := range categories {
		var count int64
		database.DB.Table("post_categories").Where("category_id = ?", cat.ID).Count(&count)
		categoryStats = append(categoryStats, CategoryStat{
			ID:        cat.ID,
			Name:      cat.Name,
			Slug:      cat.Slug,
			PostCount: count,
		})
	}

	return c.JSON(fiber.Map{
		"total_posts":        totalPosts,
		"published_posts":    publishedPosts,
		"draft_posts":        draftPosts,
		"total_views":        totalViews,
		"total_categories":   totalCategories,
		"total_comments":     totalComments,
		"total_reactions":    totalReactions,
		"top_viewed_posts":   topPosts,
		"category_stats":     categoryStats,
	})
}
