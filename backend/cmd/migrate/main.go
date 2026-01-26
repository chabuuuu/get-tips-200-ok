package main

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"regexp"

	"github.com/adrg/frontmatter"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/joho/godotenv"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

type HexoFrontMatter struct {
	Title string   `yaml:"title"`
	Date  string   `yaml:"date"` // Hexo dates are often strings
	Tags  []string `yaml:"tags"`
	Alias string   `yaml:"alias"` // Sometimes used for slugs
}

func main() {
	// Load env from parent directory (backend/.env)
	if err := godotenv.Load("../../.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	database.Connect()

	sourceDir := "../../../legacy_hexo/source/_posts"
	files, err := os.ReadDir(sourceDir)
	if err != nil {
		log.Fatal(err)
	}

	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM),
	)

	// Fetch default admin user to assign posts to
	var adminUser models.User
	if err := database.DB.First(&adminUser).Error; err != nil {
		log.Println("Warning: No admin user found. Posts will be assigned UserID=1 (might check constraints)")
		adminUser.ID = 1
	}

	count := 0
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".md" {
			content, err := os.ReadFile(filepath.Join(sourceDir, file.Name()))
			if err != nil {
				log.Println("Error reading file:", file.Name())
				continue
			}

			var matter HexoFrontMatter
			rest, err := frontmatter.Parse(bytes.NewReader(content), &matter)
			if err != nil {
				log.Println("Error parsing frontmatter for:", file.Name(), err)
				// Continue anyway, maybe handle as plain text? or skip
				// Skip usually
				continue
			}

			// Pre-process Content: Convert Hexo tags to Markdown
			stringContent := string(rest)
			
			// Replace {% blockquote %} with >
			// Simple regex for basic Hexo blockquotes
			reBlockquote := regexp.MustCompile(`\{% blockquote .*?%\}\n?([\s\S]*?)\{% endblockquote %\}`)
			stringContent = reBlockquote.ReplaceAllString(stringContent, "> $1")
            
            // Replace {% codeblock %} with ```
             reCodeblock := regexp.MustCompile(`\{% codeblock .*?%\}\n?([\s\S]*?)\{% endcodeblock %\}`)
             stringContent = reCodeblock.ReplaceAllString(stringContent, "```\n$1\n```")


			// Convert Markdown to HTML
			var buf bytes.Buffer
			if err := md.Convert([]byte(stringContent), &buf); err != nil {
				log.Println("Error converting markdown:", file.Name(), err)
				continue
			}

			// Parse Date
			// Hexo date format: YYYY-MM-DD HH:mm:ss usually
			parsedTime, err := time.Parse("2006-01-02 15:04:05", matter.Date)
			if err != nil {
				// Try alternative format
				parsedTime, err = time.Parse("2006-01-02", matter.Date)
				if err != nil {
					parsedTime = time.Now() // Fallback
				}
			}

			// Slug
			slug := strings.TrimSuffix(file.Name(), ".md")
			// Or use alias if present?
			// Let's stick to filename as slug for consistency with hexo urls normally

			post := models.Post{
				Title:       matter.Title,
				Slug:        slug,
				Content:     buf.String(),
				IsPublished: true,
				CreatedAt:   parsedTime,
				UpdatedAt:   parsedTime,
				UserID:      adminUser.ID,
			}
			
			// Check if exists
			var exists int64
			database.DB.Model(&models.Post{}).Where("slug = ?", slug).Count(&exists)
			if exists > 0 {
				log.Println("Skipping existing post:", slug)
				continue
			}

			if err := database.DB.Create(&post).Error; err != nil {
				log.Println("Error creating post:", slug, err)
			} else {
				fmt.Println("Imported:", matter.Title)
				count++
			}
		}
	}
	fmt.Printf("Migration complete. Imported %d posts.\n", count)
}
