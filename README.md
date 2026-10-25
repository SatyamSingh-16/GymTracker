# 🏋️ GymTracker — Distributed Fitness & Strength Platform

GymTracker is a full-stack, enterprise-pattern fitness tracking platform built with **Go (Golang)**, **gRPC**, **Protocol Buffers**, **PostgreSQL**, and **React 19 (Vite + TypeScript)**. 

It combines modern high-performance microservice architecture with a sleek, responsive dark-mode glassmorphism user experience.

---

## 🔗 Quick Links & Submission Deliverables

- **Live Deployed Application**: [https://gym-tracker-six-tau.vercel.app](https://gym-tracker-six-tau.vercel.app)
- **Demo Video Walkthrough**: [Watch on Google Drive](https://drive.google.com/drive/folders/1WBfdQO_L2RYuAolM-hJV9MPB8wSuKIBf?usp=sharing)
- **GitHub Repository**: [https://github.com/satyamsingh-16/GymTracker](https://github.com/satyamsingh-16/GymTracker)

---

## 🎯 Problem Statement

Traditional workout logging apps suffer from several core issues:
1. **Unstructured & Fragmented Tracking**: Most mobile applications act as passive digital notepads without preserving the chronological sequence of lifts, true volume load, or compound training splits.
2. **Missing Strength Periodization Analytics**: Lifters and strength athletes lack instantaneous access to multi-formula 1-Rep Max (1RM) projections and periodized working weight targets (strength, hypertrophy, endurance).
3. **High Latency & Monolithic Bottlenecks**: Heavy analytical calculations often run synchronously on web servers or on client devices, degrading user experience.

---

## 👥 Target Users

- **Strength Athletes & Powerlifters**: Needing precise 1RM projections across proven mathematical models (Epley, Brzycki, Lombardi) to plan training cycles.
- **Gym Enthusiasts & Bodybuilders**: Requiring structured compound split organization (Push, Pull, Legs, Upper, Lower), live draft tonnage calculation, and smart isometric tracking.
- **Fitness Coaches & Trainers**: Wanting clear progressive overload charts and trend curves over historical workouts.

---

## 💡 The Solution

GymTracker bridges the gap between everyday workout logging and sports science analytics:
- **Distributed Microservice Architecture**: Offloads CPU-intensive 1RM calculations and strength periodization to a high-speed **Go gRPC Microservice** running over binary HTTP/2, achieving $< 3\text{ms}$ latency.
- **Smart Adaptive Input System**: Automatically detects whether an exercise is weight-based (reps + kg) or isometric (duration in seconds, e.g. Planks).
- **Live Draft Volume Engine**: Calculates total session tonnage moved in real time as the user types.
- **AI Strength Coach**: Integrates Google Gemini 1.5 Flash to provide contextual routine advice and form tips.

---

## 🌟 Architecture Overview

GymTracker implements the industry-standard **API Gateway ➔ gRPC Microservice** architecture:

```
                          ┌───────────────────────────┐
                          │   React 19 Web Frontend   │
                          │   (Vite + TS + Tailwind)  │
                          │   Deployed on Vercel      │
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
- **Interactive Exercise Trends**: Progress charts powered by **Recharts** showing historical 1RM and session volume curves over time.

### 4. 📚 Comprehensive Exercise Catalog
- 61+ pre-seeded standard gym movements categorized across individual muscle groups and compound splits.
- Searchable encyclopedia with instant filtering by muscle, split, and equipment.

### 5. 🤖 AI Fitness Coach
- Built-in AI coaching assistant powered by **Google Gemini 1.5 Flash**, providing real-time workout advice, form feedback, and routine suggestions.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8 | Ultra-fast SPA with strict type safety |
| **Styling** | TailwindCSS + Glassmorphism | Custom dark-mode UI with responsive design |
| **Data Viz** | Recharts, Lucide React | Progressive overload charts and modern iconography |
| **API Gateway** | Go (Golang 1.25), Chi Router v5 | High-throughput REST API with middleware & CORS |
| **Microservice** | gRPC v1.83, Protocol Buffers v3 | Binary RPC for high-speed strength calculations |
| **Database** | PostgreSQL, `lib/pq` driver | Relational persistence with foreign keys & auto-migrations |
| **Auth & Security** | JWT (`golang-jwt/jwt/v5`), bcrypt | Stateless token auth and secure password hashing |
| **AI Integration** | Google Gemini 1.5 Flash API | Contextual fitness & workout coaching assistant |
| **Hosting** | Vercel (Frontend), Cloudflare Tunnel | Global CDN edge hosting & HTTPS tunneling |

---

## 📂 Project Structure

```text
GymTracker/
├── backend/
│   ├── db/                  # PostgreSQL connection & auto-migrations
│   ├── dto/                 # Data Transfer Objects (Request/Response structs)
│   ├── grpcclient/          # gRPC client connection manager & connection pool
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
│   │   ├── context/         # AuthContext and state providers
│   │   ├── pages/           # Pages (Dashboard, LogWorkout, Progress, Exercises, Auth)
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vercel.json          # SPA routing rewrites for Vercel
│   └── vite.config.ts
│
└── README.md
```

---

## 🏁 Local Setup & Installation

### Prerequisites
- **Go**: 1.22 or higher
- **Node.js**: v18 or higher (with npm)
- **PostgreSQL**: Running locally or via Docker

---

### 1. Database Setup

1. Create a PostgreSQL database named `gymtracker`:
   ```bash
   createdb gymtracker
   ```
2. Configure your environment variables in `backend/.env` (see template below).  
*(All tables and 61+ exercise seeds will be automatically created on backend startup!)*

---

### 2. Environment Variables Configuration

#### Backend Configuration (`backend/.env`):
```env
# Server Port
PORT=8080

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=gymtracker
DB_SSLMODE=disable

# JWT Secret
JWT_SECRET=super-secret-jwt-key-gymtracker-2026

# Internal gRPC Microservice Address
ANALYTICS_GRPC_ADDR=127.0.0.1:50051

# AI Coach (Optional - Google Gemini 1.5 Flash)
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Frontend Configuration (`frontend/.env`):
```env
# In development, leave empty to use local Vite proxy:
VITE_API_URL=

# In production (e.g. Vercel), set to your deployed backend URL:
# VITE_API_URL=https://your-backend-api.com
```

---

### 3. Running Locally

#### Step A: Start the gRPC Analytics Microservice (Port 50051)
```bash
cd backend
go run services/analytics-service/main.go
```
*Output: `🚀 gRPC Analytics Microservice running on port :50051`*

#### Step B: Start the Main Go API Server (Port 8080)
In a second terminal:
```bash
cd backend
go run main.go
```
*Output: `🚀 GymTracker Go Backend server listening on port :8080`*

#### Step C: Start the Frontend (Port 3000)
In a third terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:3000`**.

---

## 📡 API Endpoints Reference

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
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

## 🎥 Demo Video Session

Watch the complete 4-minute demonstration of GymTracker covering user authentication, live workout tracking, the gRPC 1RM engine, and the Gemini AI coach:

👉 **[Watch Demo Video on Google Drive](https://drive.google.com/drive/folders/1WBfdQO_L2RYuAolM-hJV9MPB8wSuKIBf?usp=sharing)**

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
