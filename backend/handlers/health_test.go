package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestHealthCheck verifies the health check handler returns:
// 1. HTTP 200 OK status code.
// 2. Content-Type header of application/json.
// 3. Expected JSON body containing status: ok.
func TestHealthCheck(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/health", nil)
	rec := httptest.NewRecorder()

	HealthCheck(rec, req)

	// Check status code
	if rec.Code != http.StatusOK {
		t.Errorf("expected status code %d, got %d", http.StatusOK, rec.Code)
	}

	// Check Content-Type header
	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", contentType)
	}

	// Check JSON response body
	var response map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if response["status"] != "ok" {
		t.Errorf("expected status 'ok', got %q", response["status"])
	}

	if response["message"] == "" {
		t.Error("expected non-empty message in response")
	}
}
