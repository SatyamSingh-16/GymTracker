package handlers

import (
	"log"
	"net/http"

	"gymtracker-backend/db"
	"gymtracker-backend/utils"
)

// HealthCheck responds with the operational status of the API and its database.
// It returns 503 when PostgreSQL is unreachable so hosting health checks (e.g. Render)
// do not route traffic to an instance that cannot serve logins.
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	if err := db.Ping(r.Context()); err != nil {
		log.Printf("Health check: database unavailable: %v", err)
		utils.JSON(w, http.StatusServiceUnavailable, map[string]string{
			"status":   "unavailable",
			"database": "unavailable",
			"message":  "GymTracker API is running but cannot reach the database",
		})
		return
	}

	utils.JSON(w, http.StatusOK, map[string]string{
		"status":   "ok",
		"database": "ok",
		"message":  "GymTracker Go REST API is running smoothly!",
	})
}
