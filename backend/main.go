package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/haphuthinh/get-tips-200-ok-backend/database"
	"github.com/haphuthinh/get-tips-200-ok-backend/handlers"
	"github.com/haphuthinh/get-tips-200-ok-backend/services"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to Database
	database.Connect()

	// Init Storage
	services.InitMinio()

	// Initialize Fiber app
	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Adjust this for production security
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Routes
	setupRoutes(app)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "Backend is running!",
		})
	})

	// Auth Routes
	api.Post("/login", handlers.Login)

	// Post Routes (Public)
	api.Get("/posts", handlers.GetPosts)
    api.Get("/posts/recommended", handlers.GetRecommendedPosts) // Specific route before wildcard
	api.Get("/posts/:slug", handlers.GetPost)
	api.Get("/posts/:postId/comments", handlers.GetComments)
	api.Post("/comments", handlers.AddComment)
	api.Post("/reactions", handlers.ReactToPost)

	// Post Routes (Protected)
	api.Get("/admin/posts/:id", handlers.Protected(), handlers.GetPostByID)
	api.Post("/posts", handlers.Protected(), handlers.CreatePost)
	api.Put("/posts/:id", handlers.Protected(), handlers.UpdatePost)
	api.Delete("/posts/:id", handlers.Protected(), handlers.DeletePost)

	// Upload Route (Protected)
	// Upload Route (Protected)
	api.Post("/upload", handlers.Protected(), handlers.Upload)

    // Category Routes
    api.Get("/categories", handlers.GetCategories)
    api.Get("/categories/:id", handlers.GetCategory) // Needed for Edit
    api.Post("/categories", handlers.Protected(), handlers.CreateCategory) // Admin
    api.Put("/categories/:id", handlers.Protected(), handlers.UpdateCategory) // Admin
    api.Delete("/categories/:id", handlers.Protected(), handlers.DeleteCategory) // Admin
}
