package handlers

import (
	"net/http"

	"gymtracker-backend/utils"
)

// HealthCheck responds with the operational status of the API
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	utils.JSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"message": "GymTracker Go REST API is running smoothly!",
	})
}
