package routes

import (
	"gymtracker-backend/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// SetupRouter initializes and configures the Chi router with middleware and endpoints
func SetupRouter() *chi.Mux {
	r := chi.NewRouter()

	// Logger & Recoverer Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Configure CORS for Next.js frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health Check Endpoint
	r.Get("/api/health", handlers.HealthCheck)

	return r
}
