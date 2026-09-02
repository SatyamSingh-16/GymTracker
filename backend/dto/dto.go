package dto

import "gymtracker-backend/models"

// RegisterRequest holds user registration input
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest holds credentials for authentication
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse holds JWT token and user profile returned upon successful auth
type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// CreateWorkoutRequest holds payload for logging a new workout session
type CreateWorkoutRequest struct {
	WorkoutDate string              `json:"workout_date"`
	Notes       string              `json:"notes"`
	Sets        []models.WorkoutSet `json:"sets"`
}

// ProgressDataPoint holds aggregated exercise performance over time for Recharts graphs
type ProgressDataPoint struct {
	Date         string  `json:"date"`
	MaxWeight    float64 `json:"max_weight"`
	Estimated1RM float64 `json:"estimated_1rm"`
	TotalVolume  float64 `json:"total_volume"`
}
