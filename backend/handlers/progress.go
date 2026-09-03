package handlers

import (
	"net/http"
	"strconv"

	customMiddleware "gymtracker-backend/middleware"
	"gymtracker-backend/repository"
	"gymtracker-backend/utils"

	"github.com/go-chi/chi/v5"
)

// GetProgress returns progress data points over time for a given exercise for the authenticated user
func GetProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	exerciseIDStr := chi.URLParam(r, "exercise_id")
	exerciseID, err := strconv.Atoi(exerciseIDStr)
	if err != nil || exerciseID <= 0 {
		utils.Error(w, http.StatusBadRequest, "Invalid exercise ID parameter")
		return
	}

	progressData, err := repository.GetExerciseProgress(userID, exerciseID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve exercise progress data")
		return
	}

	utils.JSON(w, http.StatusOK, progressData)
}
