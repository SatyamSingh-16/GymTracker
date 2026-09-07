package repository

import (
	"database/sql"
	"errors"
	"fmt"

	"gymtracker-backend/db"
	"gymtracker-backend/dto"
	"gymtracker-backend/models"
)

var (
	ErrWorkoutNotFound     = errors.New("workout log not found")
	ErrUnauthorizedWorkout = errors.New("you do not have permission to access or modify this workout")
)

// CreateWorkout creates a workout session header and all associated sets in an atomic SQL transaction
func CreateWorkout(userID int, req dto.CreateWorkoutRequest) (*models.WorkoutLog, error) {
	tx, err := db.DB.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed starting database transaction: %w", err)
	}
	defer tx.Rollback()

	workoutType := req.WorkoutType
	if workoutType == "" {
		workoutType = "General"
	}

	// 1. Insert header into workout_logs
	logQuery := `
		INSERT INTO workout_logs (user_id, workout_date, workout_type, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at;
	`

	var workout models.WorkoutLog
	workout.UserID = userID
	workout.WorkoutDate = req.WorkoutDate
	workout.WorkoutType = workoutType
	workout.Notes = req.Notes

	err = tx.QueryRow(logQuery, userID, req.WorkoutDate, workoutType, req.Notes).Scan(&workout.ID, &workout.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed inserting workout log header: %w", err)
	}

	// 2. Insert individual sets into workout_sets
	setQuery := `
		INSERT INTO workout_sets (workout_log_id, exercise_id, set_number, reps, weight_kg)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id;
	`

	savedSets := make([]models.WorkoutSet, 0, len(req.Sets))
	for i, set := range req.Sets {
		var setID int
		setNum := set.SetNumber
		if setNum <= 0 {
			setNum = i + 1
		}

		err = tx.QueryRow(setQuery, workout.ID, set.ExerciseID, setNum, set.Reps, set.WeightKG).Scan(&setID)
		if err != nil {
			return nil, fmt.Errorf("failed inserting set #%d: %w", i+1, err)
		}

		savedSet := models.WorkoutSet{
			ID:           setID,
			WorkoutLogID: workout.ID,
			ExerciseID:   set.ExerciseID,
			SetNumber:    setNum,
			Reps:         set.Reps,
			WeightKG:     set.WeightKG,
		}
		savedSets = append(savedSets, savedSet)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed committing workout transaction: %w", err)
	}

	workout.Sets = savedSets
	return &workout, nil
}

// GetUserWorkouts fetches all workout logs with nested sets for a specific user
func GetUserWorkouts(userID int) ([]models.WorkoutLog, error) {
	query := `
		SELECT 
			w.id, w.user_id, TO_CHAR(w.workout_date, 'YYYY-MM-DD'), COALESCE(w.workout_type, 'General'), COALESCE(w.notes, ''), w.created_at,
			s.id, s.exercise_id, e.name, s.set_number, s.reps, s.weight_kg
		FROM workout_logs w
		LEFT JOIN workout_sets s ON w.id = s.workout_log_id
		LEFT JOIN exercises e ON s.exercise_id = e.id
		WHERE w.user_id = $1
		ORDER BY w.workout_date DESC, w.id DESC, s.set_number ASC;
	`

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed querying user workouts: %w", err)
	}
	defer rows.Close()

	workoutMap := make(map[int]*models.WorkoutLog)
	workoutOrder := []int{}

	for rows.Next() {
		var (
			wID, uID                           int
			wDate, wType, notes                string
			wCreatedAt                         sql.NullTime
			sID, exID, setNum, reps            sql.NullInt64
			exName                             sql.NullString
			weightKG                           sql.NullFloat64
		)

		err := rows.Scan(
			&wID, &uID, &wDate, &wType, &notes, &wCreatedAt,
			&sID, &exID, &exName, &setNum, &reps, &weightKG,
		)
		if err != nil {
			return nil, fmt.Errorf("failed scanning workout row: %w", err)
		}

		wLog, exists := workoutMap[wID]
		if !exists {
			wLog = &models.WorkoutLog{
				ID:          wID,
				UserID:      uID,
				WorkoutDate: wDate,
				WorkoutType: wType,
				Notes:       notes,
				CreatedAt:   wCreatedAt.Time,
				Sets:        []models.WorkoutSet{},
			}
			workoutMap[wID] = wLog
			workoutOrder = append(workoutOrder, wID)
		}

		if sID.Valid {
			wLog.Sets = append(wLog.Sets, models.WorkoutSet{
				ID:           int(sID.Int64),
				WorkoutLogID: wID,
				ExerciseID:   int(exID.Int64),
				ExerciseName: exName.String,
				SetNumber:    int(setNum.Int64),
				Reps:         int(reps.Int64),
				WeightKG:     weightKG.Float64,
			})
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating workout rows: %w", err)
	}

	result := make([]models.WorkoutLog, 0, len(workoutOrder))
	for _, id := range workoutOrder {
		result = append(result, *workoutMap[id])
	}

	return result, nil
}

// GetWorkoutByID retrieves a single workout log by ID ensuring user ownership
func GetWorkoutByID(workoutID, userID int) (*models.WorkoutLog, error) {
	workouts, err := GetUserWorkouts(userID)
	if err != nil {
		return nil, err
	}

	for _, w := range workouts {
		if w.ID == workoutID {
			return &w, nil
		}
	}

	return nil, ErrWorkoutNotFound
}

// DeleteWorkout removes a workout log and cascading sets for a user
func DeleteWorkout(workoutID, userID int) error {
	query := `DELETE FROM workout_logs WHERE id = $1 AND user_id = $2;`
	res, err := db.DB.Exec(query, workoutID, userID)
	if err != nil {
		return fmt.Errorf("failed deleting workout log: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrWorkoutNotFound
	}

	return nil
}

// DeleteWorkoutSet removes an individual workout set and cleans up empty parent logs
func DeleteWorkoutSet(setID, userID int) error {
	var workoutLogID int
	checkQuery := `
		SELECT s.workout_log_id
		FROM workout_sets s
		JOIN workout_logs w ON s.workout_log_id = w.id
		WHERE s.id = $1 AND w.user_id = $2;
	`
	err := db.DB.QueryRow(checkQuery, setID, userID).Scan(&workoutLogID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrWorkoutNotFound
		}
		return fmt.Errorf("failed verifying set ownership: %w", err)
	}

	deleteSetQuery := `DELETE FROM workout_sets WHERE id = $1;`
	if _, err := db.DB.Exec(deleteSetQuery, setID); err != nil {
		return fmt.Errorf("failed deleting set: %w", err)
	}

	// If no sets remain in that parent workout log, remove the empty workout log
	var remainingCount int
	countQuery := `SELECT COUNT(*) FROM workout_sets WHERE workout_log_id = $1;`
	if err := db.DB.QueryRow(countQuery, workoutLogID).Scan(&remainingCount); err == nil && remainingCount == 0 {
		_, _ = db.DB.Exec(`DELETE FROM workout_logs WHERE id = $1;`, workoutLogID)
	}

	return nil
}
