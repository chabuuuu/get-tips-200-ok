package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"strings"

	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system envs")
	}

	database.Connect()
	db := database.DB

	// Path to legacy post
	legacyPath := "/home/haphuthinh/Workplace/Work_project/Side_project/GET-TIPS-200-OK_BLOG/legacy_hexo/source/_posts/My-New-Post.md"

	contentBytes, err := ioutil.ReadFile(legacyPath)
	if err != nil {
		log.Fatalf("Failed to read %s: %v", legacyPath, err)
	}
    content := string(contentBytes)

    // Parse Frontmatter
    // We only need the content really, but let's be clean
    parts := strings.SplitN(content, "---", 3)
    if len(parts) < 3 {
        log.Fatal("Invalid frontmatter format")
    }
    body := strings.TrimSpace(parts[2])

    // Clean up Hexo-specific tags if any (like {% ... %})
    // Simple regex to remove likely liquid tags or just keep as is if it's standarish markdown
    
    // Upsert Post
    slug := "about-me"
    title := "About Me"
    
    var post models.Post
    err = db.Where("slug = ?", slug).First(&post).Error
    
    post.Title = title
    post.Slug = slug
    post.Content = body
    post.IsPublished = true
    post.Description = "About the author"
    // Set a default user ID if creating new (assuming ID 1 is admin)
    if post.UserID == 0 {
        post.UserID = 1
    }

    if err != nil {
        // Create
        if err := db.Create(&post).Error; err != nil {
            log.Fatalf("Failed to create about page: %v", err)
        }
        fmt.Println("Created About Me post")
    } else {
        // Update
        if err := db.Save(&post).Error; err != nil {
             log.Fatalf("Failed to update about page: %v", err)
        }
        fmt.Println("Updated About Me post")
    }
}
