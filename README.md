# 🏋️ GymTracker — Distributed Fitness & Strength Platform

GymTracker is a full-stack, enterprise-pattern fitness tracking platform built with **Go (Golang)**, **gRPC**, **Protocol Buffers**, **PostgreSQL**, and **React (Vite + TypeScript)**. 

It combines modern high-performance backend microservice architecture with a sleek, responsive glassmorphism user experience.

---

## 🌟 Architecture Overview

GymTracker implements the industry-standard **API Gateway ➔ gRPC Microservice** architecture:

```
                          ┌───────────────────────────┐
                          │   React 19 Web Frontend   │
                          │   (Vite + TS + Tailwind)  │
                          │        Port: 3000         │
                          └─────────────┬─────────────┘
                                        │
                                HTTP / REST (JSON)
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │    Go REST API Gateway    │
                          │     (Chi Router + JWT)    │
                          │        Port: 8080         │
                          └───────┬───────────┬───────┘
                                  │           │
                 SQL (lib/pq)     │           │   gRPC over HTTP/2 (Binary)
                                  ▼           │   (analytics.proto contract)
                     ┌──────────────────┐     │
                     │ PostgreSQL DB    │     ▼
                     │ (Users, Logs,    │ ┌───────────────────────────┐
                     │ Sets, Exercises) │ │ gRPC Analytics Service    │
                     └──────────────────┘ │ (1RM & Strength Zones)    │
                                          │        Port: 50051        │
                                          └───────────────────────────┘
```

---

## 🚀 Key Features

### 1. ⚡ High-Speed gRPC Analytics Microservice (Port 50051)
- **Protocol Buffer Contracts**: Strict, compile-time typed schema defined in `proto/analytics/analytics.proto`.
- **Multi-Formula 1RM Engine**: Computes instant 1-Rep Max projections across **Epley**, **Brzycki**, and **Lombardi** powerlifting formulas in **under 2.5ms**.
- **Periodized Strength Zones**: Calculates target working weights for:
  - 🔴 **Heavy Strength (90% 1RM)**: 1–3 reps (peak neural drive)
  - 🟡 **Hypertrophy (75% 1RM)**: 8–12 reps (muscle fiber recruitment)
  - 🟢 **Muscular Endurance (60% 1RM)**: 15+ reps (conditioning & lactate buffering)

### 2. 📝 Interactive Workout Logger
- **Dynamic Split Filtering**: Instant dropdown filtering based on selected splits:
  - Single Muscle: `Chest`, `Back`, `Biceps`, `Triceps`, `Shoulders`, `Legs`, `Core`
  - Compound Splits: `Push Day`, `Pull Day`, `Back & Biceps`, `Chest & Triceps`, `Legs Day`, `Full Body`
- **Smart Time vs. Reps Detection**: Automatically adapts input fields for isometric exercises (e.g., Planks, Wall Sits track seconds/time; Bench Press tracks reps + weight).
- **Live Draft Volume Calculator**: Real-time ticker calculating total tonnage moved during the active logging session.

### 3. 📊 Daily Grouped Dashboard & Progress Tracking
- **Chronological Set Tracking**: Accurately tracks workout progression throughout the day (Set 1, Set 2, Set 3... Set N) preserving the true sequence of lifts.
- **Hierarchical Grouping**: Organizes exercises under clean daily split cards with per-card volume (kg) and estimated calorie burn (~kcal).
- **Interactive Exercise Trends**: Progress charts powered by Recharts showing historical 1RM and session volume curves over time.

### 4. 📚 Comprehensive Exercise Catalog
- 61+ pre-seeded standard gym movements categorized across individual muscle groups and compound splits.
- Searchable encyclopedia with instant filtering by muscle, split, and equipment.

### 5. 🤖 AI Fitness Coach
- Built-in AI coaching assistant providing real-time workout advice, form feedback, and routine suggestions.

---

## 🛠️ Technology Stack

### Backend
- **Language**: Go (Golang 1.25)
- **HTTP Routing**: [Chi Router v5](https://github.com/go-chi/chi)
- **RPC Framework**: [gRPC v1.83](https://grpc.io/) & [Protocol Buffers v3](https://protobuf.dev/)
- **Database**: PostgreSQL with `lib/pq` driver
- **Authentication**: JWT (`golang-jwt/jwt/v5`) with `bcrypt` password hashing
- **CORS & Middleware**: Strict CORS handling, structured request logging, panic recovery

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS + TailwindCSS design system with custom glassmorphism
- **Icons**: Lucide React
- **Data Visualization**: Recharts

---

## 📂 Project Structure

```
GymTracker/
├── backend/
│   ├── client/              # gRPC client connection manager & pool
│   ├── db/                  # PostgreSQL connection & auto-migrations
│   ├── dto/                 # Data Transfer Objects (Request/Response structs)
│   ├── handlers/            # HTTP handlers (Auth, Workouts, Exercises, Analytics, AI)
│   ├── middleware/          # JWT authentication middleware
│   ├── models/              # Core domain models
│   ├── proto/analytics/     # Protobuf schema (.proto) & generated Go stubs
│   ├── repository/          # PostgreSQL database access layer
│   ├── routes/              # Chi router endpoint definitions
│   ├── services/
│   │   └── analytics-service/ # Standalone gRPC Analytics Microservice (:50051)
│   ├── utils/               # JWT & JSON response helpers
│   ├── go.mod
│   └── main.go              # Go API Gateway entrypoint (:8080)
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Typed API client & endpoints
│   │   ├── components/      # UI components (OneRMCalculator, Layout, Common)
│   │   ├── pages/           # Pages (Dashboard, LogWorkout, Progress, Exercises, Auth)
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites
- **Go**: 1.22 or higher
- **Node.js**: v18 or higher (with npm)
- **PostgreSQL**: Running locally or via Docker
- **Protoc** *(Optional, for regenerating protobufs)*: `brew install protobuf` + `protoc-gen-go`

---

### 1. Database Setup

1. Create a PostgreSQL database named `gymtracker`:
   ```bash
   createdb gymtracker
   ```
2. Configure your environment variables in `backend/.env`:
   ```env
   PORT=8080
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_NAME=gymtracker
   DB_SSLMODE=disable
   JWT_SECRET=super-secret-jwt-key-gymtracker-2026
   ANALYTICS_GRPC_ADDR=127.0.0.1:50051
   ```
*(All tables and 61+ exercise seeds will be automatically created on backend startup!)*

---

### 2. Start the Backend Services

#### A. Start the gRPC Analytics Microservice (Port 50051)
```bash
cd backend
go run services/analytics-service/main.go
```
*Output: `🚀 gRPC Analytics Microservice running on port :50051`*

#### B. Start the Main Go API Server (Port 8080)
In a new terminal:
```bash
cd backend
go run main.go
```
*Output: `🚀 GymTracker Go Backend server listening on port :8080`*

---

### 3. Start the Frontend

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:3000`**.

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck endpoint |
| `POST` | `/api/auth/register` | Register new lifter account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `GET` | `/api/exercises` | List all 61+ categorized exercises |
| `GET` | `/api/exercises/{id}` | Get exercise details by ID |
| `POST` | `/api/analytics/1rm` | Calculate multi-formula 1RM & zones via internal gRPC |

### Protected Endpoints *(Requires `Authorization: Bearer <token>`)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/workouts` | Get user's workout history with nested sets |
| `POST` | `/api/workouts` | Create a workout session with sets |
| `GET` | `/api/workouts/{id}` | Get single workout session by ID |
| `DELETE` | `/api/workouts/{id}` | Delete workout session |
| `DELETE` | `/api/workouts/sets/{id}` | Delete single set row with auto-cleanup |
| `GET` | `/api/progress/{exercise_id}` | Get progressive 1RM and volume trends |
| `POST` | `/api/ai/coach` | Chat with AI fitness coach |

---

## 🔬 Compiling Protobuf Contracts (Optional)

If you modify `backend/proto/analytics/analytics.proto`:
```bash
cd backend
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/analytics/analytics.proto
```

---

## 📄 License
This project is open-source under the MIT License.
