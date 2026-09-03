package utils

import (
	"strings"
	"testing"
)

// TestGenerateAndValidateToken tests the end-to-end token lifecycle:
// Generating a valid token and verifying claims (UserID, Email) are preserved intact.
func TestGenerateAndValidateToken(t *testing.T) {
	userID := 101
	email := "iron_lifter@example.com"

	tokenStr, err := GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}

	if tokenStr == "" {
		t.Fatal("expected non-empty token string")
	}

	claims, err := ValidateToken(tokenStr)
	if err != nil {
		t.Fatalf("expected token to be valid, got: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %d, got %d", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("expected Email %q, got %q", email, claims.Email)
	}
}

// TestValidateToken_Invalid uses table-driven testing to assert that
// bad, empty, or tampered tokens are rejected with an error.
func TestValidateToken_Invalid(t *testing.T) {
	// First generate a real valid token to test tampering
	validToken, err := GenerateToken(1, "user@test.com")
	if err != nil {
		t.Fatalf("failed to generate base token: %v", err)
	}

	// Tamper with the last character of the signature
	tamperedToken := validToken[:len(validToken)-5] + "XXXXX"

	testCases := []struct {
		name     string
		tokenStr string
	}{
		{
			name:     "empty token string",
			tokenStr: "",
		},
		{
			name:     "random garbage string",
			tokenStr: "not.a.jwt.token",
		},
		{
			name:     "tampered token signature",
			tokenStr: tamperedToken,
		},
		{
			name:     "missing signature component",
			tokenStr: strings.Join(strings.Split(validToken, ".")[:2], "."),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			claims, err := ValidateToken(tc.tokenStr)
			if err == nil {
				t.Errorf("expected error for case %q, but got nil (claims: %+v)", tc.name, claims)
			}
		})
	}
}
