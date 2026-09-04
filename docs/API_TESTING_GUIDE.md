# GymTracker API Testing & Documentation Guide

Welcome to the GymTracker backend testing and documentation guide! This guide explains how to test all API endpoints interactively and view the OpenAPI/Swagger specification.

---

## 🚀 1. Starting the Go Backend Server

Ensure PostgreSQL is running, then start the server from the `backend/` directory:

```bash
cd backend
go run main.go
```

The server will start listening at:
`http://localhost:8080`

---

## ⚡ 2. Using the Interactive REST Client (`api_tests.http`)

The easiest way to test endpoints without external tools like Postman is using [`backend/api_tests.http`](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/api_tests.http).

### How to Use:
1. In **VS Code** or **Cursor**, install the extension: **`REST Client`** (by Huachao Mao).
2. Open [`backend/api_tests.http`](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/backend/api_tests.http).
3. Above each request, you will see a clickable **`Send Request`** button.
4. Run requests in this order:
   - **Step 1**: Run `GET {{baseUrl}}/health` to verify server is alive.
   - **Step 2**: Run `GET {{baseUrl}}/exercises` to view the seeded exercise catalog.
   - **Step 3**: Run `POST {{baseUrl}}/auth/register` to register your test account.
   - **Step 4**: Run `POST {{baseUrl}}/auth/login` — this will automatically set `@authToken`.
   - **Step 5**: Run `GET {{baseUrl}}/auth/me` to verify your JWT token is working.
   - **Step 6**: Run `POST {{baseUrl}}/workouts` to log a workout with multiple sets.
   - **Step 7**: Run `GET {{baseUrl}}/workouts` to inspect your logged workouts.
   - **Step 8**: Run `GET {{baseUrl}}/progress/1` to view your 1RM and volume analytics!

---

## 📖 3. Viewing the OpenAPI / Swagger Documentation

The complete API contract is documented in [`docs/openapi.yaml`](file:///Users/satyamsingh2730/Desktop/GoLang/Battle/Go_Projects/GymTracker/docs/openapi.yaml).

### Option A: Online Swagger Editor (No Install Needed)
1. Open [editor.swagger.io](https://editor.swagger.io/) in your browser.
2. Click **File -> Import file** and select `docs/openapi.yaml`.
3. You will see the visual Swagger UI documentation with every route, schema, and response code.

### Option B: Inside VS Code / Cursor
Install the extension **`OpenAPI (Swagger) Editor`** or **`Swagger Viewer`** to preview the documentation visually with `Shift + Alt + E`.

---

## 💻 4. Testing with cURL

You can also test the endpoints directly from your terminal using `curl`:

### Health Check:
```bash
curl -i http://localhost:8080/api/health
```

### Exercise Catalog:
```bash
curl -i http://localhost:8080/api/exercises
```

### Register:
```bash
curl -i -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"Password123!"}'
```

### Login:
```bash
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123!"}'
```
