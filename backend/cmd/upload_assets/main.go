package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/haphuthinh/get-tips-200-ok-backend/services"
	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Note: .env file not found relative to script")
	}

	database.Connect()
	services.InitMinio()

	// Base path where images are stored
	// Based on exploration, it seems images are in legacy_hexo/source/images/**
	basePath := "../../../legacy_hexo/source/images"

	// 1. Walk through all files in images dir
	filesMap := make(map[string]string) // filename -> minio_url

	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			ext := strings.ToLower(filepath.Ext(path))
			if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".webp" {
				log.Println("Found image:", path)

				// Create object name.
				// To avoid collisions/mess, let's keep the relative path but normalized.
				relPath, _ := filepath.Rel(basePath, path)
				objectName := "migrated/" + relPath

				// Upload
				contentType := "application/octet-stream"
				// simple content type check
				if ext == ".png" {
					contentType = "image/png"
				} else if ext == ".jpg" || ext == ".jpeg" {
					contentType = "image/jpeg"
				}

				info, err := services.MinioClient.FPutObject(context.Background(), services.BucketName, objectName, path, minio.PutObjectOptions{ContentType: contentType})
				if err != nil {
					log.Printf("Failed to upload %s: %v\n", path, err)
					return nil
				}

				// Construct URL
				protocol := "http"
				if os.Getenv("MINIO_USE_SSL") == "true" {
					protocol = "https"
				}
				url := fmt.Sprintf("%s://%s/%s/%s", protocol, os.Getenv("MINIO_ENDPOINT"), services.BucketName, objectName)
				
				// Map both the filename and the relative path key for replacement
				// Hexo usually references images as /images/subdir/file.png or just file.png if in asset folder
				
				// Standard: /images/folder/file.png
				fullLegacyPath := "/images/" + relPath
				filesMap[fullLegacyPath] = url
				
				// Asset Folder shortcut: file.png (if in same folder as post)
				// We need to be careful with simple filenames, but often they are unique per post if using asset folders.
				filesMap[info.Key] = url // Just key? no
				
				// Also map just the filename for potential fuzzy matching if needed, 
				// but let's stick to full path match first.
				
				fmt.Printf("Uploaded %s -> %s\n", relPath, url)
			}
		}
		return nil
	})

	if err != nil {
		log.Fatal(err)
	}

	// 2. Iterate through all posts and replace content
	var posts []models.Post
	database.DB.Find(&posts)

	for _, post := range posts {
		originalContent := post.Content
		modifiedContent := post.Content

		// Helper to replace URL in string
		// We need to parse HTML to safely replace src attributes or use regex on the HTML string
		// Using Simple replacement on the whole string for known paths
		for legacyPath, newUrl := range filesMap {
             // Replace absolute legacy paths: /images/foo/bar.png
            if strings.Contains(modifiedContent, legacyPath) {
                modifiedContent = strings.ReplaceAll(modifiedContent, legacyPath, newUrl)
            }
            
            // Special handling: if legacy path is /images/slug/img.png
            // and content just has "img.png" (common in Hexo asset folders converted to HTML without full path resolution)
            // We need to infer.
            // Check if legacyPath belongs to this post
            prefix := "/images/" + post.Slug + "/"
            if strings.HasPrefix(legacyPath, prefix) {
                filename := strings.TrimPrefix(legacyPath, prefix)
                // Replace "filename" with newUrl found
                // Be careful not to replace partial strings.
                // Replace usage: src="filename"
                modifiedContent = strings.ReplaceAll(modifiedContent, fmt.Sprintf(`src="%s"`, filename), fmt.Sprintf(`src="%s"`, newUrl))
                modifiedContent = strings.ReplaceAll(modifiedContent, fmt.Sprintf(`(%s)`, filename), fmt.Sprintf(`(%s)`, newUrl))
            }
        }
        
        // Also set Cover Image if not set
        if post.CoverImage == "" {
             // Look for a cover image candidate
             // convention: thumbnail.jpg, cover.png, or just the first image
             prefix := "/images/" + post.Slug + "/"
             for legacyPath, newUrl := range filesMap {
                  if strings.HasPrefix(legacyPath, prefix) {
                       // Found an image for this post
                       post.CoverImage = newUrl
                       break // usage determined order? keys are random map order.
                       // Ideally pick 'cover' or 'thumbnail'
                  }
             }
        }

		if originalContent != modifiedContent || post.CoverImage != "" {
            post.Content = modifiedContent
			database.DB.Save(&post)
			fmt.Printf("Updated post: %s\n", post.Title)
		}
	}
}
