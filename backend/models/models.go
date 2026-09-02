package models

import "time"

// User represents a registered user account in PostgreSQL
type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// Exercise represents a cataloged exercise
type Exercise struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Category  string `json:"category"`
	Equipment string `json:"equipment"`
}

// WorkoutSet represents an individual set within a logged workout session
type WorkoutSet struct {
	ID           int     `json:"id"`
	WorkoutLogID int     `json:"workout_log_id"`
	ExerciseID   int     `json:"exercise_id"`
	ExerciseName string  `json:"exercise_name,omitempty"`
	SetNumber    int     `json:"set_number"`
	Reps         int     `json:"reps"`
	WeightKG     float64 `json:"weight_kg"`
}

// WorkoutLog represents a full workout session header
type WorkoutLog struct {
	ID          int          `json:"id"`
	UserID      int          `json:"user_id"`
	WorkoutDate string       `json:"workout_date"`
	Notes       string       `json:"notes"`
	CreatedAt   time.Time    `json:"created_at"`
	Sets        []WorkoutSet `json:"sets,omitempty"`
}
