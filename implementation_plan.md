# Implementation Plan: Automated Backend Testing for GymTracker

## Goal Description
Introduce automated testing to the GymTracker Go backend. Since this is your first time working with automated backend tests, this plan explains **all fundamental concepts**, **why we test each component**, and **how Go's built-in testing engine works**, before we create the test suite.

---

## 🎓 Core Concepts: Testing in Go Explained Simply

### 1. What is Automated Testing?
Instead of manually opening a browser or sending requests with Postman to check if things work, automated tests are small Go programs that run your functions with sample input and automatically verify whether the output matches expectations.

### 2. How Go Testing Works (Standard Library Conventions)
Go has testing built directly into the language via the `testing` package:
- **File Naming**: Any file ending in `_test.go` (e.g. `hash_test.go`) is recognized by Go as a test file. Go ignores these files when building the production binary, so they add **zero bloat** to production code.
- **Function Naming**: Test functions must start with `Test` and accept `t *testing.T` (e.g. `func TestHashPassword(t *testing.T)`).
- **`*testing.T`**: The test runner object. If something doesn't match expectations, you call `t.Errorf(...)` or `t.Fatalf(...)` to mark the test as failed.
- **Running Tests**: You simply run `go test ./...` in the terminal to execute all tests across the entire project in milliseconds.

### 3. What Are We Testing & Why?

| Layer | What It Does | Why Test It? | What Could Go Wrong Without Tests? |
| :--- | :--- | :--- | :--- |
| **`utils/hash.go`** | Bcrypt password hashing & comparison | Ensure passwords are encrypted securely and verification never gives false positives or false negatives. | Plaintext saved in DB, or valid passwords rejected during login. |
| **`utils/jwt.go`** | Generates and verifies JWT tokens with expiration | Ensure user identity claims (`UserID`, `Email`) are preserved, expired tokens are rejected, and tampered tokens fail. | Unauthorized users spoofing other users' IDs or expired tokens granting eternal access. |
| **`middleware/auth.go`** | Protects API routes, extracts Bearer token, sets UserID in Context | Ensure requests without tokens or with malformed headers are immediately blocked (`401 Unauthorized`). | Protected user workout data exposed to unauthenticated users. |
| **`handlers/health.go`** | Server health check endpoint | Verify HTTP status codes (`200 OK`) and JSON responses using Go's `net/http/httptest` package. | Broken response formatting or crashing on simple pings. |

---

## 💡 How Could We Have Done It Better? (Design Decisions & Alternatives)

1. **Table-Driven Tests (Idiomatic Go)**:
   - *Naive approach*: Writing copy-pasted code for each test scenario.
   - *Better approach (Idiomatic Go)*: Defining a slice of test cases (structs with `name`, `input`, `expectedOutput`) and iterating over them with `t.Run(tc.name, func(t *testing.T) { ... })`. This gives crystal-clear failure reports telling you exactly which scenario failed.
2. **HTTP Testing without starting a live network server (`net/http/httptest`)**:
   - *Naive approach*: Actually starting a server on port `:8080` and sending real HTTP requests over the network (slow, can conflict with open ports).
   - *Better approach*: Using Go's built-in `httptest.NewRecorder()` and `httptest.NewRequest()`. It calls the HTTP handler directly in memory in less than 1 millisecond.
3. **Database Separation (Unit Tests vs Database Integration Tests)**:
   - For this initial step, we isolate business logic (utils, tokens, middleware, request validation) so tests run **instantaneously** without needing a live PostgreSQL instance running on your machine.
   - In subsequent steps, we can add database integration tests using a dedicated test database or test transactions.

---

## User Review Required

> [!NOTE]
> No existing production code needs to be modified. All work consists of adding new `*_test.go` test files.

Please review the proposed test structure below. Once you approve, we will create these test files and run them.

---

## Proposed Changes

### Layer 1: Utilities (`backend/utils/`)

#### [NEW] [hash_test.go](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/utils/hash_test.go)
- `TestHashPassword`: Validates that hashing a password produces a non-empty, non-plaintext bcrypt hash, and that two hashes of the same password differ (bcrypt salting).
- `TestCheckPasswordHash`: Validates that the correct password matches the hash, and an incorrect password returns `false`.

#### [NEW] [jwt_test.go](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/utils/jwt_test.go)
- `TestGenerateAndValidateToken`: Validates generating a token with a `userID` and `email`, then verifying that `ValidateToken` extracts the identical `userID` and `email`.
- `TestValidateToken_Invalid`: Validates that empty strings, tampered tokens, and garbage strings return an error and fail validation.

---

### Layer 2: Middleware (`backend/middleware/`)

#### [NEW] [auth_test.go](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/middleware/auth_test.go)
- Table-driven test using `httptest.NewRecorder()` and a dummy protected handler:
  1. **Missing Authorization Header** -> Expect `401 Unauthorized`.
  2. **Malformed Header (e.g. `Basic abc`)** -> Expect `401 Unauthorized`.
  3. **Invalid/Forged Token** -> Expect `401 Unauthorized`.
  4. **Valid Bearer Token** -> Expect `200 OK` and verify that `GetUserIDFromContext` correctly extracts the user ID.

---

### Layer 3: Handlers (`backend/handlers/`)

#### [NEW] [health_test.go](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/handlers/health_test.go)
- Tests `HealthCheck` using `httptest.NewRequest("GET", "/api/health", nil)`:
  - Asserts HTTP status code is `200 OK`.
  - Asserts JSON response body contains `{"status":"ok", ...}`.

---

## Verification Plan

### Automated Tests
Run all tests from the backend directory:
```bash
cd backend
go test -v ./...
```
Expected output:
- `=== RUN TestHashPassword` -> `--- PASS`
- `=== RUN TestCheckPasswordHash` -> `--- PASS`
- `=== RUN TestGenerateAndValidateToken` -> `--- PASS`
- `=== RUN TestValidateToken_Invalid` -> `--- PASS`
- `=== RUN TestAuthMiddleware` -> `--- PASS`
- `=== RUN TestHealthCheck` -> `--- PASS`
- Final verdict: `PASS` across all packages.
