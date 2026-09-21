package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/services"
)

var nonAlphaNumRegex = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func Upload(c *fiber.Ctx) error {
	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File required"})
	}

	// Ensure temp directory exists
	tempDir := "./temp"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create temporary directory"})
	}

	// Sanitize filename
	cleanName := filepath.Base(file.Filename)
	cleanName = strings.ReplaceAll(cleanName, " ", "_")
	cleanName = nonAlphaNumRegex.ReplaceAllString(cleanName, "_")
	if cleanName == "" || cleanName == "." {
		cleanName = "uploaded_image.png"
	}

	uniquePrefix := fmt.Sprintf("%d_%d", time.Now().UnixNano(), os.Getpid())
	tempFilename := fmt.Sprintf("%s_%s", uniquePrefix, cleanName)
	tempPath := filepath.Join(tempDir, tempFilename)

	// Save file to temporary local path
	if err := c.SaveFile(file, tempPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not save file"})
	}
	defer func() {
		_ = os.Remove(tempPath)
	}()

	// Upload to MinIO
	objectName := fmt.Sprintf("%d_%s", time.Now().Unix(), cleanName)
	url, err := services.UploadFile(c.Context(), objectName, tempPath, file.Header.Get("Content-Type"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload to storage: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"link": url, // Froala expects { "link": "url" }
		"url":  url,
	})
}
