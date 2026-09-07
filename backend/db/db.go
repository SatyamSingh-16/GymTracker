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
		log.Printf("Ensure PostgreSQL server is running and database '%s' exists.\n", getEnv("DB_NAME", "gymtracker"))
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
		`ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS workout_type VARCHAR(100) DEFAULT 'General';`,
		`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_time_based BOOLEAN DEFAULT FALSE;`,
		`UPDATE exercises SET is_time_based = TRUE WHERE LOWER(name) LIKE '%plank%';`,
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
		Name        string
		Category    string
		Equipment   string
		IsTimeBased bool
	}{
		// Chest
		{"Barbell Bench Press", "Chest", "Barbell", false},
		{"Incline Dumbbell Press", "Chest", "Dumbbell", false},
		{"Decline Barbell Bench Press", "Chest", "Barbell", false},
		{"Cable Chest Fly", "Chest", "Cable", false},
		{"Dumbbell Chest Fly", "Chest", "Dumbbell", false},
		{"Push-Up", "Chest", "Bodyweight", false},
		{"Dips (Chest Focus)", "Chest", "Bodyweight", false},
		{"Machine Chest Press", "Chest", "Machine", false},

		// Back
		{"Conventional Deadlift", "Back", "Barbell", false},
		{"Barbell Bent-Over Row", "Back", "Barbell", false},
		{"Lat Pulldown", "Back", "Cable", false},
		{"Seated Cable Row", "Back", "Cable", false},
		{"Pull-Up", "Back", "Bodyweight", false},
		{"Chin-Up", "Back", "Bodyweight", false},
		{"T-Bar Row", "Back", "Machine", false},
		{"Dumbbell Single-Arm Row", "Back", "Dumbbell", false},
		{"Face Pull", "Back", "Cable", false},
		{"Back Extension (Hyperextension)", "Back", "Bodyweight", false},

		// Legs
		{"Barbell Back Squat", "Legs", "Barbell", false},
		{"Barbell Front Squat", "Legs", "Barbell", false},
		{"Leg Press", "Legs", "Machine", false},
		{"Romanian Deadlift (RDL)", "Legs", "Barbell", false},
		{"Dumbbell Bulgarian Split Squat", "Legs", "Dumbbell", false},
		{"Leg Extension", "Legs", "Machine", false},
		{"Seated Leg Curl", "Legs", "Machine", false},
		{"Lying Leg Curl", "Legs", "Machine", false},
		{"Standing Calf Raise", "Legs", "Machine", false},
		{"Dumbbell Walking Lunge", "Legs", "Dumbbell", false},
		{"Wall Sit", "Legs", "Bodyweight", true},

		// Shoulders
		{"Barbell Overhead Press", "Shoulders", "Barbell", false},
		{"Seated Dumbbell Shoulder Press", "Shoulders", "Dumbbell", false},
		{"Dumbbell Lateral Raise", "Shoulders", "Dumbbell", false},
		{"Cable Lateral Raise", "Shoulders", "Cable", false},
		{"Reverse Pec Deck (Rear Delt Fly)", "Shoulders", "Machine", false},
		{"Dumbbell Front Raise", "Shoulders", "Dumbbell", false},
		{"Barbell Upright Row", "Shoulders", "Barbell", false},
		{"Barbell Shrug", "Shoulders", "Barbell", false},

		// Arms
		{"Barbell Bicep Curl", "Arms", "Barbell", false},
		{"Dumbbell Hammer Curl", "Arms", "Dumbbell", false},
		{"Incline Dumbbell Curl", "Arms", "Dumbbell", false},
		{"Preacher Curl (EZ-Bar)", "Arms", "Barbell", false},
		{"Tricep Rope Pushdown", "Arms", "Cable", false},
		{"Skull Crusher", "Arms", "Barbell", false},
		{"Overhead Dumbbell Tricep Extension", "Arms", "Dumbbell", false},
		{"Dips (Triceps Focus)", "Arms", "Bodyweight", false},
		{"Close-Grip Bench Press", "Arms", "Barbell", false},
		{"Wrist Curls (Forearms)", "Arms", "Dumbbell", false},

		// Core
		{"Plank", "Core", "Bodyweight", true},
		{"Side Plank", "Core", "Bodyweight", true},
		{"Hollow Body Hold", "Core", "Bodyweight", true},
		{"Hanging Leg Raise", "Core", "Bodyweight", false},
		{"Cable Crunch", "Core", "Cable", false},
		{"Russian Twist", "Core", "Bodyweight", false},
		{"Ab Wheel Rollout", "Core", "Bodyweight", false},
		{"Cable Woodchopper", "Core", "Cable", false},
	}

	for _, ex := range defaultExercises {
		_, _ = DB.Exec(
			`INSERT INTO exercises (name, category, equipment, is_time_based) 
			VALUES ($1, $2, $3, $4) 
			ON CONFLICT (name) DO UPDATE 
			SET category = EXCLUDED.category, equipment = EXCLUDED.equipment, is_time_based = EXCLUDED.is_time_based;`,
			ex.Name, ex.Category, ex.Equipment, ex.IsTimeBased,
		)
	}
	log.Printf("✅ Expanded exercise catalog seeded (%d total exercises)!", len(defaultExercises))
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
