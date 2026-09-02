package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes PostgreSQL database connection pool, creates tables, and seeds initial data
func InitDB() (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "gymtracker"),
		getEnv("DB_SSLMODE", "disable"),
	)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	if err = DB.Ping(); err != nil {
		log.Printf("⚠️ Warning: PostgreSQL database ping failed: %v", err)
		log.Println("Ensure PostgreSQL server is running and database '%s' exists.", getEnv("DB_NAME", "gymtracker"))
	} else {
		log.Println("✅ Successfully connected to PostgreSQL database!")
		if err := createTables(); err != nil {
			return nil, fmt.Errorf("failed creating SQL tables: %w", err)
		}
		seedExercises()
	}

	return DB, nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS exercises (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) UNIQUE NOT NULL,
			category VARCHAR(50) NOT NULL,
			equipment VARCHAR(50) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS workout_logs (
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id) ON DELETE CASCADE,
			workout_date DATE NOT NULL,
			notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS workout_sets (
			id SERIAL PRIMARY KEY,
			workout_log_id INT REFERENCES workout_logs(id) ON DELETE CASCADE,
			exercise_id INT REFERENCES exercises(id) ON DELETE CASCADE,
			set_number INT NOT NULL,
			reps INT NOT NULL,
			weight_kg NUMERIC(6,2) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return err
		}
	}

	log.Println("✅ PostgreSQL database schema tables verified/created!")
	return nil
}

func seedExercises() {
	defaultExercises := []struct {
		Name      string
		Category  string
		Equipment string
	}{
		{"Barbell Bench Press", "Chest", "Barbell"},
		{"Incline Dumbbell Press", "Chest", "Dumbbell"},
		{"Barbell Back Squat", "Legs", "Barbell"},
		{"Leg Press", "Legs", "Machine"},
		{"Conventional Deadlift", "Back", "Barbell"},
		{"Lat Pulldown", "Back", "Cable"},
		{"Barbell Overhead Press", "Shoulders", "Barbell"},
		{"Dumbbell Lateral Raise", "Shoulders", "Dumbbell"},
		{"Barbell Bicep Curl", "Arms", "Barbell"},
		{"Tricep Rope Pushdown", "Arms", "Cable"},
		{"Plank", "Core", "Bodyweight"},
	}

	for _, ex := range defaultExercises {
		_, _ = DB.Exec(
			`INSERT INTO exercises (name, category, equipment) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING;`,
			ex.Name, ex.Category, ex.Equipment,
		)
	}
	log.Println("✅ Default exercise catalog seeded!")
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
