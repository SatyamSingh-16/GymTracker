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

	// Hosting platforms such as Render inject PORT; 8080 is the local development default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Without a secret, tokens would be signed with a key that is public in this repository
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("❌ JWT_SECRET is not set. Set it to a long random value (e.g. `openssl rand -hex 32`).")
	}

	// Initialize Database Connection & Auto-Migrations
	_, err := db.InitDB()
	if err != nil {
		log.Printf("Warning during DB init: %v", err)
	}

	// Initialize Router
	r := routes.SetupRouter()

	// An empty host binds every interface (0.0.0.0 and ::), so the server is reachable
	// from outside a container while localhost keeps working for the Vite dev proxy
	log.Printf("🚀 GymTracker Go Backend server listening on 0.0.0.0:%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
