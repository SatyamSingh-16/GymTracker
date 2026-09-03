package repository

import (
	"database/sql"
	"errors"
	"fmt"

	"gymtracker-backend/db"
	"gymtracker-backend/models"
)

var ErrExerciseNotFound = errors.New("exercise not found")

// GetAllExercises fetches all cataloged exercises from PostgreSQL ordered by category and name
func GetAllExercises() ([]models.Exercise, error) {
	query := `
		SELECT id, name, category, equipment
		FROM exercises
		ORDER BY category, name;
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed querying exercises: %w", err)
	}
	defer rows.Close()

	exercises := []models.Exercise{}
	for rows.Next() {
		var ex models.Exercise
		if err := rows.Scan(&ex.ID, &ex.Name, &ex.Category, &ex.Equipment); err != nil {
			return nil, fmt.Errorf("failed scanning exercise row: %w", err)
		}
		exercises = append(exercises, ex)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating exercise rows: %w", err)
	}

	return exercises, nil
}

// GetExerciseByID fetches a single exercise catalog record by its ID
func GetExerciseByID(id int) (*models.Exercise, error) {
	query := `
		SELECT id, name, category, equipment
		FROM exercises
		WHERE id = $1;
	`

	var ex models.Exercise
	err := db.DB.QueryRow(query, id).Scan(&ex.ID, &ex.Name, &ex.Category, &ex.Equipment)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrExerciseNotFound
		}
		return nil, fmt.Errorf("failed fetching exercise by ID: %w", err)
	}

	return &ex, nil
}
