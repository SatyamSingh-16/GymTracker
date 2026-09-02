package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"gymtracker-backend/dto"
	customMiddleware "gymtracker-backend/middleware"
	"gymtracker-backend/repository"
	"gymtracker-backend/utils"
)

// Register handles new user signup requests
func Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Name == "" || req.Email == "" || req.Password == "" {
		utils.Error(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	if len(req.Password) < 6 {
		utils.Error(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	user, err := repository.CreateUser(req.Name, req.Email, hashedPassword)
	if err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			utils.Error(w, http.StatusConflict, "An account with this email already exists")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to generate authentication token")
		return
	}

	utils.JSON(w, http.StatusCreated, dto.AuthResponse{
		Token: token,
		User:  *user,
	})
}

// Login handles user authentication and returns a JWT token
func Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Email == "" || req.Password == "" {
		utils.Error(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	user, err := repository.GetUserByEmail(req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			utils.Error(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to process login")
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		utils.Error(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to generate authentication token")
		return
	}

	// Do not send password hash back to client
	user.PasswordHash = ""

	utils.JSON(w, http.StatusOK, dto.AuthResponse{
		Token: token,
		User:  *user,
	})
}

// Me retrieves profile info for the currently authenticated user
func Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, err := repository.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			utils.Error(w, http.StatusNotFound, "User profile not found")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Failed to retrieve user profile")
		return
	}

	utils.JSON(w, http.StatusOK, user)
}
