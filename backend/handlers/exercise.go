package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"gymtracker-backend/repository"
	"gymtracker-backend/utils"

	"github.com/go-chi/chi/v5"
)

// GetAllExercises returns all cataloged exercises in JSON format
func GetAllExercises(w http.ResponseWriter, r *http.Request) {
	exercises, err := repository.GetAllExercises()
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve exercise catalog")
		return
	}

	utils.JSON(w, http.StatusOK, exercises)
}

// GetExerciseByID returns details for a single exercise by ID
func GetExerciseByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		utils.Error(w, http.StatusBadRequest, "Invalid exercise ID parameter")
		return
	}

	exercise, err := repository.GetExerciseByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrExerciseNotFound) {
			utils.Error(w, http.StatusNotFound, "Exercise not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve exercise detail")
		return
	}

	utils.JSON(w, http.StatusOK, exercise)
}
