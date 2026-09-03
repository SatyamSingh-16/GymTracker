package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"gymtracker-backend/utils"
)

// TestAuthMiddleware tests the AuthMiddleware using in-memory HTTP requests (httptest)
// without needing a running network server.
func TestAuthMiddleware(t *testing.T) {
	// Generate a valid JWT token for testing the happy path
	validToken, err := utils.GenerateToken(42, "athlete@gymtracker.com")
	if err != nil {
		t.Fatalf("failed to generate test token: %v", err)
	}

	testCases := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectNextRun  bool
	}{
		{
			name:           "missing authorization header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
			expectNextRun:  false,
		},
		{
			name:           "malformed header without bearer prefix",
			authHeader:     "Basic dXNlcjpwYXNz",
			expectedStatus: http.StatusUnauthorized,
			expectNextRun:  false,
		},
		{
			name:           "malformed header with single word",
			authHeader:     "BearerOnlyWithoutToken",
			expectedStatus: http.StatusUnauthorized,
			expectNextRun:  false,
		},
		{
			name:           "invalid or tampered token string",
			authHeader:     "Bearer invalid.jwt.token",
			expectedStatus: http.StatusUnauthorized,
			expectNextRun:  false,
		},
		{
			name:           "valid bearer token",
			authHeader:     "Bearer " + validToken,
			expectedStatus: http.StatusOK,
			expectNextRun:  true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			nextRan := false

			// A dummy next handler that simulates a protected endpoint
			dummyNextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				nextRan = true

				// Assert context contains the authenticated user details
				userID, ok := GetUserIDFromContext(r.Context())
				if !ok || userID != 42 {
					t.Errorf("expected userID 42 in context, got %d (ok=%v)", userID, ok)
				}

				email, ok := GetUserEmailFromContext(r.Context())
				if !ok || email != "athlete@gymtracker.com" {
					t.Errorf("expected userEmail athlete@gymtracker.com, got %q (ok=%v)", email, ok)
				}

				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte("success"))
			})

			// Wrap dummy handler with AuthMiddleware
			handlerToTest := AuthMiddleware(dummyNextHandler)

			// Create an in-memory HTTP request and response recorder
			req := httptest.NewRequest("GET", "/api/workouts", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()

			// Execute the handler
			handlerToTest.ServeHTTP(rec, req)

			// Assert HTTP status code
			if rec.Code != tc.expectedStatus {
				t.Errorf("expected status %d, got %d (body: %s)", tc.expectedStatus, rec.Code, rec.Body.String())
			}

			// Assert whether the protected next handler was executed
			if nextRan != tc.expectNextRun {
				t.Errorf("expected next handler called=%v, got=%v", tc.expectNextRun, nextRan)
			}
		})
	}
}
