package utils

import (
	"encoding/json"
	"net/http"
)

// JSON sends a JSON response with the given status code and payload
func JSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if payload != nil {
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

// Error sends a standardized JSON error response
func Error(w http.ResponseWriter, statusCode int, message string) {
	JSON(w, statusCode, map[string]string{
		"error": message,
	})
}
