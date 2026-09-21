package main

import (
	"flag"
	"fmt"
	"log"
	"strings"

	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	oldDomainFlag := flag.String("old", "media-resource.sonata.io.vn", "Old media domain to replace")
	newDomainFlag := flag.String("new", "media.chabu.io.vn", "New media domain")
	dryRunFlag := flag.Bool("dry-run", false, "Preview changes without modifying the database")
	flag.Parse()

	oldDomain := strings.TrimSpace(*oldDomainFlag)
	newDomain := strings.TrimSpace(*newDomainFlag)
	dryRun := *dryRunFlag

	if oldDomain == "" || newDomain == "" {
		log.Fatal("Error: old domain and new domain cannot be empty.")
	}

	// Try loading .env from current directory, parent, or grand-parent
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	log.Printf("Connecting to database...")
	database.Connect()
	db := database.DB

	log.Println("==========================================================")
	log.Printf("DOMAIN MIGRATION TOOL")
	log.Printf("Old Domain: %s", oldDomain)
	log.Printf("New Domain: %s", newDomain)
	if dryRun {
		log.Printf("MODE: [DRY-RUN] (No changes will be written to DB)")
	} else {
		log.Printf("MODE: [LIVE] (Database will be updated)")
	}
	log.Println("==========================================================")

	// 1. Scan Posts
	var postsToUpdate []models.Post
	likePattern := "%" + oldDomain + "%"
	err := db.Where("cover_image LIKE ? OR content LIKE ? OR description LIKE ?", likePattern, likePattern, likePattern).
		Find(&postsToUpdate).Error
	if err != nil {
		log.Fatalf("Failed to query posts: %v", err)
	}

	log.Printf("Found %d post(s) containing the old domain.", len(postsToUpdate))
	for _, p := range postsToUpdate {
		var matchedFields []string
		if strings.Contains(p.CoverImage, oldDomain) {
			matchedFields = append(matchedFields, "cover_image")
		}
		if strings.Contains(p.Content, oldDomain) {
			matchedFields = append(matchedFields, "content")
		}
		if strings.Contains(p.Description, oldDomain) {
			matchedFields = append(matchedFields, "description")
		}
		log.Printf(" - Post ID %d (\"%s\"): matches in [%s]", p.ID, p.Title, strings.Join(matchedFields, ", "))
	}

	// 2. Scan Post Translations
	var translationsToUpdate []models.PostTranslation
	err = db.Where("content LIKE ? OR description LIKE ?", likePattern, likePattern).
		Find(&translationsToUpdate).Error
	if err != nil {
		log.Fatalf("Failed to query post translations: %v", err)
	}

	log.Printf("Found %d translation(s) containing the old domain.", len(translationsToUpdate))
	for _, t := range translationsToUpdate {
		log.Printf(" - Translation ID %d (Post ID %d, Locale %s, Title \"%s\")", t.ID, t.PostID, t.Locale, t.Title)
	}

	// 3. Scan Categories
	var categoriesToUpdate []models.Category
	err = db.Where("description LIKE ?", likePattern).
		Find(&categoriesToUpdate).Error
	if err != nil {
		log.Fatalf("Failed to query categories: %v", err)
	}
	log.Printf("Found %d category(ies) containing the old domain.", len(categoriesToUpdate))

	if len(postsToUpdate) == 0 && len(translationsToUpdate) == 0 && len(categoriesToUpdate) == 0 {
		log.Println("No records contain the old domain. Everything is already up to date!")
		return
	}

	if dryRun {
		log.Println("\n[DRY-RUN] Finished scanning. Run without --dry-run to apply changes.")
		return
	}

	// 4. Perform Updates inside a Transaction
	log.Println("\nApplying domain migration in database transaction...")
	err = db.Transaction(func(tx *gorm.DB) error {
		// Update posts
		postRes := tx.Model(&models.Post{}).
			Where("cover_image LIKE ? OR content LIKE ? OR description LIKE ?", likePattern, likePattern, likePattern).
			Updates(map[string]interface{}{
				"cover_image": gorm.Expr("REPLACE(cover_image, ?, ?)", oldDomain, newDomain),
				"content":     gorm.Expr("REPLACE(content, ?, ?)", oldDomain, newDomain),
				"description": gorm.Expr("REPLACE(description, ?, ?)", oldDomain, newDomain),
			})
		if postRes.Error != nil {
			return fmt.Errorf("failed to update posts: %w", postRes.Error)
		}
		log.Printf("✓ Successfully updated %d post(s).", postRes.RowsAffected)

		// Update post_translations
		transRes := tx.Model(&models.PostTranslation{}).
			Where("content LIKE ? OR description LIKE ?", likePattern, likePattern).
			Updates(map[string]interface{}{
				"content":     gorm.Expr("REPLACE(content, ?, ?)", oldDomain, newDomain),
				"description": gorm.Expr("REPLACE(description, ?, ?)", oldDomain, newDomain),
			})
		if transRes.Error != nil {
			return fmt.Errorf("failed to update translations: %w", transRes.Error)
		}
		log.Printf("✓ Successfully updated %d translation(s).", transRes.RowsAffected)

		// Update categories
		if len(categoriesToUpdate) > 0 {
			catRes := tx.Model(&models.Category{}).
				Where("description LIKE ?", likePattern).
				Update("description", gorm.Expr("REPLACE(description, ?, ?)", oldDomain, newDomain))
			if catRes.Error != nil {
				return fmt.Errorf("failed to update categories: %w", catRes.Error)
			}
			log.Printf("✓ Successfully updated %d category(ies).", catRes.RowsAffected)
		}

		return nil
	})

	if err != nil {
		log.Fatalf("Migration transaction failed, rolled back: %v", err)
	}

	// 5. Verification
	var remainingPosts int64
	var remainingTranslations int64
	db.Model(&models.Post{}).Where("cover_image LIKE ? OR content LIKE ? OR description LIKE ?", likePattern, likePattern, likePattern).Count(&remainingPosts)
	db.Model(&models.PostTranslation{}).Where("content LIKE ? OR description LIKE ?", likePattern, likePattern).Count(&remainingTranslations)

	log.Println("==========================================================")
	log.Println("MIGRATION COMPLETED SUCCESSFULLY!")
	log.Printf("Remaining occurrences of old domain: %d", remainingPosts+remainingTranslations)
	log.Println("All image URLs have been migrated to: " + newDomain)
	log.Println("==========================================================")
}
