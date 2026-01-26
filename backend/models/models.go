package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"unique;not null" json:"username"`
	Password  string         `gorm:"not null" json:"-"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Post struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Slug        string         `gorm:"unique;not null;index" json:"slug"`
	Content     string         `gorm:"type:text" json:"content"` // HTML content from Froala
	Description string         `gorm:"type:text" json:"description"`
	CoverImage  string         `json:"cover_image"`
	UserID      uint           `json:"user_id"` // Removed not null to allow legacy posts
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	IsPublished bool           `gorm:"default:false" json:"is_published"`
	ViewCount   int64          `gorm:"default:0" json:"view_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Comments  []Comment  `gorm:"foreignKey:PostID" json:"comments,omitempty"`
	Reactions []Reaction `gorm:"foreignKey:PostID" json:"reactions,omitempty"`
	Categories []Category `gorm:"many2many:post_categories;" json:"categories,omitempty"`
	CategoryIDs []uint `gorm:"-" json:"category_ids,omitempty"`
}

type Category struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"unique;not null" json:"name"`
	Slug        string         `gorm:"unique;not null;index" json:"slug"`
	Description string         `gorm:"type:text" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	PostID    uint           `gorm:"not null;index" json:"post_id"`
	ParentID  *uint          `json:"parent_id"` // For nested replies
	Name      string         `gorm:"not null" json:"name"`
	Content   string         `gorm:"not null" json:"content"`
	LikeCount int64          `gorm:"default:0" json:"like_count"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Replies []Comment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
}

type Reaction struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PostID      uint      `gorm:"index;uniqueIndex:idx_post_reference" json:"post_id"`
	ReferenceID string    `gorm:"size:255;uniqueIndex:idx_post_reference" json:"reference_id"` // User ID or Client Fingerprint
	Type        string    `gorm:"size:20" json:"type"` // like, love, haha, wow, sad, angry
	CreatedAt   time.Time `json:"created_at"`
}
