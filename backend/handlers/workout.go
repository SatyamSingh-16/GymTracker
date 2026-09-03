package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"gymtracker-backend/dto"
	customMiddleware "gymtracker-backend/middleware"
	"gymtracker-backend/repository"
	"gymtracker-backend/utils"

	"github.com/go-chi/chi/v5"
)

// CreateWorkout handles logging a new workout session with sets
func CreateWorkout(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req dto.CreateWorkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.WorkoutDate == "" {
		req.WorkoutDate = time.Now().Format("2006-01-02")
	}

	if len(req.Sets) == 0 {
		utils.Error(w, http.StatusBadRequest, "Workout session must contain at least one exercise set")
		return
	}

	for _, set := range req.Sets {
		if set.ExerciseID <= 0 {
			utils.Error(w, http.StatusBadRequest, "Valid exercise_id is required for every set")
			return
		}
		if set.Reps <= 0 || set.WeightKG < 0 {
			utils.Error(w, http.StatusBadRequest, "Reps must be greater than 0 and weight_kg cannot be negative")
			return
		}
	}

	workout, err := repository.CreateWorkout(userID, req)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to save workout session")
		return
	}

	utils.JSON(w, http.StatusCreated, workout)
}

// GetUserWorkouts returns the workout history for the authenticated user
func GetUserWorkouts(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	workouts, err := repository.GetUserWorkouts(userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve workout history")
		return
	}

	utils.JSON(w, http.StatusOK, workouts)
}

// GetWorkoutByID retrieves a specific workout session by ID
func GetWorkoutByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := chi.URLParam(r, "id")
	workoutID, err := strconv.Atoi(idStr)
	if err != nil || workoutID <= 0 {
		utils.Error(w, http.StatusBadRequest, "Invalid workout ID parameter")
		return
	}

	workout, err := repository.GetWorkoutByID(workoutID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrWorkoutNotFound) {
			utils.Error(w, http.StatusNotFound, "Workout not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve workout")
		return
	}

	utils.JSON(w, http.StatusOK, workout)
}

// DeleteWorkout deletes a logged workout session by ID
func DeleteWorkout(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := chi.URLParam(r, "id")
	workoutID, err := strconv.Atoi(idStr)
	if err != nil || workoutID <= 0 {
		utils.Error(w, http.StatusBadRequest, "Invalid workout ID parameter")
		return
	}

	err = repository.DeleteWorkout(workoutID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrWorkoutNotFound) {
			utils.Error(w, http.StatusNotFound, "Workout not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to delete workout")
		return
	}

	utils.JSON(w, http.StatusOK, map[string]string{
		"message": "Workout deleted successfully",
	})
}
