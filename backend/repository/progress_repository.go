package repository

import (
	"fmt"

	"gymtracker-backend/db"
	"gymtracker-backend/dto"
)

// GetExerciseProgress computes session progress metrics over time for a given user and exercise
func GetExerciseProgress(userID, exerciseID int) ([]dto.ProgressDataPoint, error) {
	query := `
		SELECT 
			TO_CHAR(w.workout_date, 'YYYY-MM-DD') AS date,
			COALESCE(MAX(s.weight_kg), 0) AS max_weight,
			COALESCE(ROUND(MAX(s.weight_kg * (1 + s.reps::numeric / 30.0)), 2), 0) AS estimated_1rm,
			COALESCE(ROUND(SUM(s.reps * s.weight_kg), 2), 0) AS total_volume
		FROM workout_logs w
		JOIN workout_sets s ON w.id = s.workout_log_id
		WHERE w.user_id = $1 AND s.exercise_id = $2
		GROUP BY w.workout_date
		ORDER BY w.workout_date ASC;
	`

	rows, err := db.DB.Query(query, userID, exerciseID)
	if err != nil {
		return nil, fmt.Errorf("failed querying progress data: %w", err)
	}
	defer rows.Close()

	dataPoints := []dto.ProgressDataPoint{}
	for rows.Next() {
		var dp dto.ProgressDataPoint
		if err := rows.Scan(&dp.Date, &dp.MaxWeight, &dp.Estimated1RM, &dp.TotalVolume); err != nil {
			return nil, fmt.Errorf("failed scanning progress row: %w", err)
		}
		dataPoints = append(dataPoints, dp)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating progress rows: %w", err)
	}

	return dataPoints, nil
}
