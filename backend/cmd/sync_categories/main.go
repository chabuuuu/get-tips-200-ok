package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/joho/godotenv"
)

func main() {
    // Load .env relative to this file's future location (cmd/sync_categories/main.go -> ../../.env)
    // Adjust path as we run from root usually or specifically.
    // Let's assume we run from backend root.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system envs")
	}

	database.Connect()
	db := database.DB

	// Path to legacy posts
	legacyPath := "../legacy_hexo/source/_posts" 
    // Absolute path is safer if running via tool
    legacyPath = "/home/haphuthinh/Workplace/Work_project/Side_project/GET-TIPS-200-OK_BLOG/legacy_hexo/source/_posts"

	files, err := ioutil.ReadDir(legacyPath)
	if err != nil {
		log.Fatal(err)
	}

    // Regex to parse YAML frontmatter
    // ---
    // ...
    // categories:
    //   - backend
    //   - database
    // ...
    // ---
    // Note: Hexo frontmatter can vary. We look for 'categories:' block.
	
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".md") {
			continue
		}

		content, err := ioutil.ReadFile(filepath.Join(legacyPath, file.Name()))
		if err != nil {
			log.Printf("Failed to read %s: %v", file.Name(), err)
			continue
		}

        slug := strings.TrimSuffix(file.Name(), ".md")
        // The migration script logic for slug: strings.ReplaceAll(strings.ToLower(post.Title), " ", "-") 
        // BUT the file name in Hexo usually MATCHES the desired slug or is close to it.
        // Let's rely on the DB having posts with this slug OR try matching by Title if slug fails.
        // Actually, previous migration likely used filename as slug or Title-based.
        // Let's parse Title from frontmatter to be sure.

        titleRegex := regexp.MustCompile(`title:\s*(.*)`)
        titleMatch := titleRegex.FindSubmatch(content)
        var title string
        if len(titleMatch) > 1 {
            title = strings.TrimSpace(string(titleMatch[1]))
            // Handle quotes if present
            title = strings.Trim(title, `"'`)
        }

        // Parse categories
		// Simple approach: Look for "categories:" and subsequent lines starting with "  - " until a line doesn't.
        // Or "categories: [a, b]"
        
        cats := parseCategories(string(content))
        if len(cats) == 0 {
            continue
        }

        fmt.Printf("Processing %s -> Categories: %v\n", slug, cats)

        // Find Post
        var post models.Post
        // Try exact slug match from filename first (most reliable for Hexo)
        if err := db.Where("slug = ?", slug).First(&post).Error; err != nil {
             // Try searching by Title-generated slug or Title directly
             // NOTE: Existing migration code: post.Slug = strings.ReplaceAll(strings.ToLower(post.Title), " ", "-")
             // titleSlug := strings.ReplaceAll(strings.ToLower(title), " ", "-")
             
             // If not found by filename slug, try Title exact match?
             if title != "" {
                 if err := db.Where("title = ?", title).First(&post).Error; err != nil {
                     log.Printf("Post not found for %s / %s", slug, title)
                     continue
                 }
             } else {
                 log.Printf("Post not found for slug %s", slug)
                 continue
             }
        }

        // Sync Categories
        var catModels []models.Category
        for _, catName := range cats {
            var cat models.Category
            // clean catName
            catName = strings.TrimSpace(catName)
            catSlug := strings.ToLower(strings.ReplaceAll(catName, " ", "-"))
            
            err := db.Where("slug = ?", catSlug).FirstOrInit(&cat, models.Category{Slug: catSlug}).Error
            if err != nil {
                log.Printf("Error finding/init category %s: %v", catName, err)
                continue
            }
            
            // If new, set name
            if cat.ID == 0 {
                cat.Name = catName
                if err := db.Create(&cat).Error; err != nil {
                     log.Printf("Failed to create category %s: %v", catName, err)
                     continue
                }
                fmt.Printf("Created Category: %s\n", cat.Name)
            }
            catModels = append(catModels, cat)
        }

        // Update Association
        if len(catModels) > 0 {
            err = db.Model(&post).Association("Categories").Replace(catModels)
            if err != nil {
                log.Printf("Failed to replace categories for post %s: %v", post.Title, err)
            } else {
                fmt.Printf("Updated Post: %s with categories %v\n", post.Title, cats)
            }
        }
	}
}

func parseCategories(content string) []string {
    var cats []string
    // Normalize content
    lines := strings.Split(content, "\n")
    inCategories := false
    
    for _, line := range lines {
        line = strings.TrimRight(line, "\r") // Windows EOL
        
        if strings.HasPrefix(line, "categories:") {
            inCategories = true
            // Check inline list: categories: [a, b]
            if strings.Contains(line, "[") && strings.Contains(line, "]") {
                 val := strings.TrimPrefix(line, "categories:")
                 val = strings.TrimSpace(val)
                 val = strings.Trim(val, "[]")
                 parts := strings.Split(val, ",")
                 for _, p := range parts {
                     cats = append(cats, strings.TrimSpace(p))
                 }
                 return cats 
            }
            continue
        }
        
        if inCategories {
            if strings.HasPrefix(line, "  - ") || strings.HasPrefix(line, "- ") {
                cat := strings.TrimLeft(line, " -")
                cats = append(cats, strings.TrimSpace(cat))
            } else if strings.TrimSpace(line) == "" {
                continue 
            } else {
                // Indentation stopped or new key
                // Hexo frontmatter is strict, but loose parsing helps.
                // Assuming categories block ends when dedented or new key potentially.
                // Safest to stop if line starts with non-space and not '-'
                if match, _ := regexp.MatchString(`^[a-z]`, line); match {
                    break
                }
            }
        }
        
        if strings.HasPrefix(line, "---") && len(cats) > 0 {
             break // End of frontmatter
        }
    }
    return cats
}
