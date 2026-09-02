package repository

import (
	"database/sql"
	"errors"
	"fmt"

	"gymtracker-backend/db"
	"gymtracker-backend/models"
)

var (
	ErrUserAlreadyExists = errors.New("user with this email already exists")
	ErrUserNotFound      = errors.New("user not found")
)

// CreateUser inserts a new user record into PostgreSQL and returns the created User model
func CreateUser(name, email, passwordHash string) (*models.User, error) {
	query := `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, created_at;
	`

	var user models.User
	err := db.DB.QueryRow(query, name, email, passwordHash).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.CreatedAt,
	)

	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("failed creating user: %w", err)
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by email, including the password_hash for authentication comparison
func GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, name, email, password_hash, created_at
		FROM users
		WHERE email = $1;
	`

	var user models.User
	err := db.DB.QueryRow(query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed fetching user by email: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user profile by ID (excluding password hash)
func GetUserByID(id int) (*models.User, error) {
	query := `
		SELECT id, name, email, created_at
		FROM users
		WHERE id = $1;
	`

	var user models.User
	err := db.DB.QueryRow(query, id).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed fetching user by ID: %w", err)
	}

	return &user, nil
}

// Helper to detect PostgreSQL unique constraint violation (duplicate email)
func isUniqueViolation(err error) bool {
	return err != nil && (contains(err.Error(), "unique constraint") || contains(err.Error(), "duplicate key"))
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || findSubstr(s, substr))
}

func findSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
