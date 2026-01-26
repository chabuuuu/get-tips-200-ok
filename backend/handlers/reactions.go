package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
)

// ReactToPost (Public)
// ReactToPost (Public)
func ReactToPost(c *fiber.Ctx) error {
	type ReactRequest struct {
		PostID      uint   `json:"post_id"`
		ReferenceID string `json:"reference_id"`
		Type        string `json:"type"`
	}

	var req ReactRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
    
    // Validate Reference (e.g. from unique fingerprint or ID)
    if req.ReferenceID == "" {
        // Fallback or Error? Allow "guest" but ideally client sends a fingerprint
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Reference ID required"})
    }

	var reaction models.Reaction
	err := database.DB.Where("post_id = ? AND reference_id = ?", req.PostID, req.ReferenceID).First(&reaction).Error

	var currentType string

	if err == nil {
		// Found existing
		if reaction.Type == req.Type {
			// Toggle OFF (Remove)
			database.DB.Delete(&reaction)
			currentType = ""
		} else {
			// Switch Type
			reaction.Type = req.Type
			database.DB.Save(&reaction)
			currentType = req.Type
		}
	} else {
		// New Reaction
		newReaction := models.Reaction{
			PostID:      req.PostID,
			ReferenceID: req.ReferenceID,
			Type:        req.Type,
		}
		database.DB.Create(&newReaction)
		currentType = req.Type
	}

	// Calculate new counts
	var results []struct {
		Type  string
		Count int64
	}
	database.DB.Model(&models.Reaction{}).
		Where("post_id = ?", req.PostID).
		Select("type, count(*) as count").
		Group("type").
		Scan(&results)

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Type] = r.Count
	}

	return c.JSON(fiber.Map{
		"my_reaction": currentType,
		"counts":      counts,
	})
}
