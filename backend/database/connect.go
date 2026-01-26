package database

import (
	"fmt"
	"log"
	"os"

	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
		os.Getenv("DB_TIMEZONE"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Connected to Database successfully")

	log.Println("Running AutoMigrate...")
	err = DB.AutoMigrate(&models.User{}, &models.Post{}, &models.Comment{}, &models.Reaction{})
	if err != nil {
		log.Fatal("Failed to migrate database. \n", err)
	}
	log.Println("Database Migrated")
}
