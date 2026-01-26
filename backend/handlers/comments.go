package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
)

// AddComment (Public)
func AddComment(c *fiber.Ctx) error {
	var comment models.Comment
	if err := c.BodyParser(&comment); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not post comment"})
	}

	return c.JSON(comment)
}

// GetComments (Public, associated with a post)
// Typically fetched via GetPost Preload, but separate endpoint is good for pagination
func GetComments(c *fiber.Ctx) error {
	postID := c.Params("postId")
	var comments []models.Comment
	// Fetch top-level comments with their replies preloaded
	if err := database.DB.Where("post_id = ? AND parent_id IS NULL", postID).Preload("Replies").Find(&comments).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch comments"})
	}
	return c.JSON(comments)
}
