package handlers

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"gymtracker-backend/db"
)

// fakeDriver is a minimal database/sql driver whose connections always ping successfully
type fakeDriver struct{}
type fakeConn struct{}

func (fakeDriver) Open(string) (driver.Conn, error)  { return fakeConn{}, nil }
func (fakeConn) Prepare(string) (driver.Stmt, error) { return nil, errors.New("not supported") }
func (fakeConn) Close() error                        { return nil }
func (fakeConn) Begin() (driver.Tx, error)           { return nil, errors.New("not supported") }

func init() {
	sql.Register("fake-healthy", fakeDriver{})
}

func runHealthCheck(t *testing.T) (*httptest.ResponseRecorder, map[string]string) {
	t.Helper()
	req := httptest.NewRequest("GET", "/api/health", nil)
	rec := httptest.NewRecorder()

	HealthCheck(rec, req)

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
	return rec, response
}

// TestHealthCheck verifies the health check handler returns:
// 1. HTTP 200 OK status code when the database is reachable.
// 2. Content-Type header of application/json.
// 3. Expected JSON body containing status: ok.
func TestHealthCheck(t *testing.T) {
	conn, err := sql.Open("fake-healthy", "")
	if err != nil {
		t.Fatal(err)
	}
	db.DB = conn
	t.Cleanup(func() { db.DB = nil })

	rec, response := runHealthCheck(t)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status code %d, got %d", http.StatusOK, rec.Code)
	}
	if response["status"] != "ok" || response["database"] != "ok" {
		t.Errorf("expected status and database 'ok', got %v", response)
	}
	if response["message"] == "" {
		t.Error("expected non-empty message in response")
	}
}

// TestHealthCheckDatabaseUnavailable verifies a 503 when the database is not connected
func TestHealthCheckDatabaseUnavailable(t *testing.T) {
	db.DB = nil

	rec, response := runHealthCheck(t)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status code %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}
	if response["database"] != "unavailable" {
		t.Errorf("expected database 'unavailable', got %q", response["database"])
	}
}
