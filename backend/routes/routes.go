package routes

import (
	"log"
	"os"
	"strings"

	"gymtracker-backend/handlers"
	customMiddleware "gymtracker-backend/middleware"

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

	// Configure CORS for the React frontend. Registered before any route so that
	// preflight OPTIONS requests are answered for every endpoint. Auth uses a Bearer
	// header (not cookies), so credentialed CORS is not needed.
	origins := AllowedOrigins(os.Getenv("CORS_ALLOWED_ORIGINS"))
	log.Printf("CORS allowed origins: %s", strings.Join(origins, ", "))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Health Check Endpoint
	r.Get("/api/health", handlers.HealthCheck)

	// Exercise Catalog Endpoints (Public)
	r.Get("/api/exercises", handlers.GetAllExercises)
	r.Get("/api/exercises/{id}", handlers.GetExerciseByID)

	// Analytics & 1RM Calculations (Powered by internal gRPC microservice)
	r.Post("/api/analytics/1rm", handlers.Calculate1RMHandler)

	// Authentication Endpoints (Public)
	r.Post("/api/auth/register", handlers.Register)
	r.Post("/api/auth/login", handlers.Login)

	// Protected Endpoints (Requires JWT Auth Middleware)
	r.Group(func(r chi.Router) {
		r.Use(customMiddleware.AuthMiddleware)

		// Profile
		r.Get("/api/auth/me", handlers.Me)

		// Workouts
		r.Post("/api/workouts", handlers.CreateWorkout)
		r.Get("/api/workouts", handlers.GetUserWorkouts)
		r.Get("/api/workouts/{id}", handlers.GetWorkoutByID)
		r.Delete("/api/workouts/{id}", handlers.DeleteWorkout)
		r.Delete("/api/workouts/sets/{id}", handlers.DeleteWorkoutSet)

		// Progress Analytics
		r.Get("/api/progress/{exercise_id}", handlers.GetProgress)

		// AI Fitness Coach
		r.Post("/api/ai/coach", handlers.AICoachChat)
	})

	return r
}

// defaultAllowedOrigins covers local development when CORS_ALLOWED_ORIGINS is unset
var defaultAllowedOrigins = []string{
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:4173", // vite preview
}

// AllowedOrigins parses a comma-separated CORS_ALLOWED_ORIGINS value
// (e.g. "https://gym-tracker.vercel.app,http://localhost:3000").
// The "*" wildcard is ignored so the API never allows every origin by accident.
func AllowedOrigins(raw string) []string {
	var origins []string
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimRight(strings.TrimSpace(o), "/")
		if o == "" {
			continue
		}
		if o == "*" {
			log.Println("⚠️ Warning: ignoring \"*\" in CORS_ALLOWED_ORIGINS; list the frontend origins explicitly")
			continue
		}
		origins = append(origins, o)
	}

	if len(origins) == 0 {
		// An empty list would make go-chi/cors allow all origins
		log.Println("⚠️ Warning: CORS_ALLOWED_ORIGINS is not set; only local development origins are allowed")
		return defaultAllowedOrigins
	}
	return origins
}
