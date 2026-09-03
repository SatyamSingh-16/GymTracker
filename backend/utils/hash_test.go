package utils

import (
	"testing"
)

// TestHashPassword tests that:
// 1. A password can be hashed without error.
// 2. The resulting hash is non-empty and not plaintext.
// 3. Two hashes of the same password produce different results (bcrypt salt effect).
func TestHashPassword(t *testing.T) {
	rawPassword := "SuperSecret123!"

	hash1, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("expected no error hashing password, got: %v", err)
	}

	if hash1 == "" {
		t.Fatal("expected non-empty hash string")
	}

	if hash1 == rawPassword {
		t.Fatal("hash should not match plaintext password")
	}

	// Bcrypt uses a random salt each time, so hashing twice should give different strings
	hash2, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("expected no error hashing password second time, got: %v", err)
	}

	if hash1 == hash2 {
		t.Errorf("bcrypt should generate unique salts for each hash; got identical hashes")
	}
}

// TestCheckPasswordHash tests that:
// 1. The original plaintext password correctly validates against the hash.
// 2. An incorrect password fails validation.
func TestCheckPasswordHash(t *testing.T) {
	password := "correct-password-42"
	wrongPassword := "wrong-password"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to generate password hash: %v", err)
	}

	// Case 1: Correct password
	if !CheckPasswordHash(password, hash) {
		t.Errorf("expected password %q to match hash %q, but it failed", password, hash)
	}

	// Case 2: Wrong password
	if CheckPasswordHash(wrongPassword, hash) {
		t.Errorf("expected wrong password %q to NOT match hash %q, but it succeeded", wrongPassword, hash)
	}

	// Case 3: Empty password against non-empty hash
	if CheckPasswordHash("", hash) {
		t.Errorf("expected empty password to NOT match hash, but it succeeded")
	}
}
