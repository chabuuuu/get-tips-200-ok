package main

import (
	"log"
	"os"

	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/models"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load env from parent directory
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Note: .env file not found or error loading")
	}

	database.Connect()

	username := os.Getenv("ADMIN_USERNAME")
	password := os.Getenv("ADMIN_PASSWORD")

	if username == "" || password == "" {
		log.Fatal("ADMIN_USERNAME or ADMIN_PASSWORD not set in env")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := models.User{
		Username: username,
		Password: string(hashedPassword),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		log.Println("Error creating admin user (might already exist):", err)
	} else {
		log.Println("Admin user created successfully")
	}
}
