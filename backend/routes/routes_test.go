package routes

import (
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

const prodOrigin = "https://gymtracker.example.vercel.app"

func TestAllowedOrigins(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want []string
	}{
		{"unset falls back to local dev", "", defaultAllowedOrigins},
		{"wildcard only falls back to local dev", "*", defaultAllowedOrigins},
		{"trims spaces and trailing slashes", " https://a.vercel.app/ , http://localhost:3000 ,", []string{"https://a.vercel.app", "http://localhost:3000"}},
		{"drops wildcard but keeps explicit origins", "https://a.vercel.app,*", []string{"https://a.vercel.app"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := AllowedOrigins(tt.raw); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("AllowedOrigins(%q) = %v, want %v", tt.raw, got, tt.want)
			}
		})
	}
}

func preflight(t *testing.T, origin string) *httptest.ResponseRecorder {
	t.Helper()
	t.Setenv("CORS_ALLOWED_ORIGINS", prodOrigin)
	req := httptest.NewRequest(http.MethodOptions, "/api/auth/login", nil)
	req.Header.Set("Origin", origin)
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	req.Header.Set("Access-Control-Request-Headers", "content-type,authorization")
	rec := httptest.NewRecorder()
	SetupRouter().ServeHTTP(rec, req)
	return rec
}

func TestCORSPreflightAllowedOrigin(t *testing.T) {
	rec := preflight(t, prodOrigin)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected preflight status 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != prodOrigin {
		t.Errorf("expected Access-Control-Allow-Origin %q, got %q", prodOrigin, got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); got != http.MethodPost {
		t.Errorf("expected Access-Control-Allow-Methods POST, got %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "" {
		t.Errorf("expected no Access-Control-Allow-Credentials header, got %q", got)
	}
}

func TestCORSPreflightRejectsUnknownOrigin(t *testing.T) {
	rec := preflight(t, "https://evil.example.com")

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no Access-Control-Allow-Origin for unknown origin, got %q", got)
	}
}

func TestCORSActualRequestAllowedOrigin(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", prodOrigin)
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.Header.Set("Origin", prodOrigin)
	rec := httptest.NewRecorder()
	SetupRouter().ServeHTTP(rec, req)

	// No database in unit tests, so health returns 503; CORS headers must still be present
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != prodOrigin {
		t.Errorf("expected Access-Control-Allow-Origin %q, got %q", prodOrigin, got)
	}
}
