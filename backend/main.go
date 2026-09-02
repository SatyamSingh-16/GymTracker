package main

import (
	"log"
	"net/http"
	"os"

	"gymtracker-backend/db"
	"gymtracker-backend/routes"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Notice: No .env file found or failed to load, falling back to system environment variables.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Database Connection & Auto-Migrations
	_, err := db.InitDB()
	if err != nil {
		log.Printf("Warning during DB init: %v", err)
	}

	// Initialize Router
	r := routes.SetupRouter()

	log.Printf("🚀 GymTracker Go Backend server listening on port :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
