# Phase 2 Micro-Step 6 Plan: Authentication Utilities (`utils/hash.go` & `utils/jwt.go`)

🎉 **Phase 1 (Backend Foundation)** is complete! All 5 core backend files (`go.mod`, `.env`, `models/models.go`, `dto/dto.go`, `db/db.go`, `main.go`) have been created.

Now we enter **Phase 2: User Authentication & Security**.

---

## 💡 Why This Step Now? (Architectural Rationale)

Before we can build API endpoints for User Registration (`POST /api/auth/register`) or Login (`POST /api/auth/login`), we need fundamental security utilities:

1. **Password Hashing (`utils/hash.go`)**:
   - Uses `golang.org/x/crypto/bcrypt` to hash raw passwords before storing them in PostgreSQL.
   - Provides `ComparePasswordHash()` to safely verify login credentials without storing plaintext passwords.

2. **JWT Token Management (`utils/jwt.go`)**:
   - Uses `github.com/golang-jwt/jwt/v5` to sign JSON Web Tokens containing the user's `ID` and `Email` with our `JWT_SECRET`.
   - Provides `ValidateToken()` to verify tokens on protected API endpoints.

---

## What We Will Create in Micro-Step 6

1. **[`Go_Projects/GymTracker/backend/utils/hash.go`](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/utils/hash.go)**:
   - `HashPassword(password string) (string, error)`
   - `CheckPasswordHash(password, hash string) bool`

2. **[`Go_Projects/GymTracker/backend/utils/jwt.go`](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/utils/jwt.go)**:
   - `GenerateToken(userID int, email string) (string, error)`
   - `ValidateToken(tokenStr string) (*Claims, error)`

---

## Code Preview

### 1. `utils/hash.go`

```go
package utils

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

### 2. `utils/jwt.go`

```go
package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "super-secret-jwt-key-gymtracker-2026"
	}
	return []byte(secret)
}

func GenerateToken(userID int, email string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 7 * time.Hour)), // 7 days valid
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	return claims, nil
}
```

---

> [!IMPORTANT]
> Please approve **Micro-Step 6** to create `utils/hash.go` and `utils/jwt.go`. Once created, we'll proceed to **Micro-Step 7 (Auth Middleware)**!
