package routes

import (
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

	// Exercise Catalog Endpoints (Public)
	r.Get("/api/exercises", handlers.GetAllExercises)
	r.Get("/api/exercises/{id}", handlers.GetExerciseByID)

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

		// Progress Analytics
		r.Get("/api/progress/{exercise_id}", handlers.GetProgress)

		// AI Fitness Coach
		r.Post("/api/ai/coach", handlers.AICoachChat)
	})

	return r
}
