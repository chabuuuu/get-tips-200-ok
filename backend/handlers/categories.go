package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
)

// GetCategories (Public)
func GetCategories(c *fiber.Ctx) error {
	var categories []models.Category
	if err := database.DB.Find(&categories).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch categories"})
	}
	return c.JSON(categories)
}

// GetCategory (Public or Protected?) - Let's make it public for now or protected. CRUD usually implies Admin. 
// But the frontend edit page needs it.
func GetCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Category not found"})
	}
	return c.JSON(category)
}

// CreateCategory (Protected/Admin)
func CreateCategory(c *fiber.Ctx) error {
	var category models.Category
	if err := c.BodyParser(&category); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if category.Slug == "" {
		category.Slug = strings.ReplaceAll(strings.ToLower(category.Name), " ", "-")
	}

	if err := database.DB.Create(&category).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create category"})
	}

	return c.JSON(category)
}

// UpdateCategory (Protected/Admin)
func UpdateCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Category not found"})
	}

	var updateData models.Category
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	database.DB.Model(&category).Updates(updateData)

	return c.JSON(category)
}

// DeleteCategory (Protected/Admin)
func DeleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.Category{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete category"})
	}
	return c.JSON(fiber.Map{"message": "Category deleted"})
}
