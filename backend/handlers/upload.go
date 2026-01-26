package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/services"
)

func Upload(c *fiber.Ctx) error {
	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File required"})
	}

	// Save file to temporary local path
	tempPath := fmt.Sprintf("./temp/%s", file.Filename)
	// Make sure temp dir exists
	// Ideally we stream, but Fiber's SaveFile is convenient
	if err := c.SaveFile(file, tempPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not save file"})
	}
	defer func() {
		// Clean up
		// os.Remove(tempPath) 
	}()

	// Upload to MinIO
	objectName := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	url, err := services.UploadFile(c.Context(), objectName, tempPath, file.Header.Get("Content-Type"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload to storage"})
	}

	return c.JSON(fiber.Map{
		"link": url, // Froala expects { "link": "url" }
	})
}
