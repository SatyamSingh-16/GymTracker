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
# Hosted databases: set DATABASE_URL instead (takes precedence over DB_*)
# DATABASE_URL=postgresql://user:password@host:5432/gymtracker

# JWT Secret (required - the server refuses to start without it)
# Generate one with: openssl rand -hex 32
JWT_SECRET=replace-with-a-long-random-secret

# Internal gRPC Microservice Address
ANALYTICS_GRPC_ADDR=127.0.0.1:50051

# AI Coach (Optional - Google Gemini 1.5 Flash)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS: frontend origins allowed to call the API (comma-separated, no "*")
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

#### Frontend Configuration (`frontend/.env`):
```env
# In development, leave empty to use local Vite proxy:
VITE_API_URL=

# In production (e.g. Vercel), set to your deployed backend URL:
# VITE_API_URL=https://your-backend-api.com
```

> `vite build` **fails on purpose** if `VITE_API_URL` is missing, not `https://`, or points at localhost, so a broken API URL can never be deployed silently.

---

## ☁️ Production Deployment (Render + Vercel)

```text
Browser ──► Vercel (React SPA, https://gym-tracker-six-tau.vercel.app)
   │
   └──── HTTPS /api/* ──► Render Web Service (Docker: Go API + gRPC analytics on 127.0.0.1:50051)
                                  │
                                  └──► Render PostgreSQL (Internal Database URL)
```

The backend is deployed from [`backend/Dockerfile`](backend/Dockerfile) using the [`render.yaml`](render.yaml) Blueprint. One container runs the REST API (bound to all interfaces on Render's `PORT`) and the internal gRPC analytics service used by `/api/analytics/1rm`.

> **Why not a Cloudflare Quick Tunnel?** `cloudflared tunnel --url ...` gets a random `*.trycloudflare.com` hostname that disappears whenever the tunnel drops (sleep, network change, reboot). Because Vite bakes `VITE_API_URL` into the bundle at build time, the deployed site then fails with `Failed to fetch` until it is rebuilt with the new URL.

### Step 1: Create the PostgreSQL database on Render

1. Render Dashboard → **New → Postgres**.
2. Database name `gymtracker`, **PostgreSQL version 17** (matches the local `pg_dump` 17 used below), and the **same region** you will use for the web service (`render.yaml` uses `singapore`; change both if you prefer another).
3. Once it is available, open its **Connections** section. You will need:
   - **Internal Database URL**, used by the web service (`DATABASE_URL`)
   - **External Database URL**, used only from your machine for the optional data migration

> Render's free PostgreSQL instances expire after a limited period (check Render's current free-tier terms). Use a paid instance if the data must persist permanently.

### Step 2 (optional): Copy existing local data to Render

Skip this step to start with an empty database. The schema and the exercise catalog are created automatically on first boot.

Do this **before** the web service first connects, into the **new, empty** database:

```bash
# Dump the local database OUTSIDE the repo (it contains user emails and password hashes)
pg_dump --format=custom --no-owner --no-acl -d gymtracker -f ~/gymtracker-backup.dump

# Paste the External Database URL without echoing it or saving it to shell history
read -rs RENDER_DB_URL && export RENDER_DB_URL

# Restore in a single transaction: either everything is copied or nothing is
pg_restore --no-owner --no-acl --exit-on-error --single-transaction -d "$RENDER_DB_URL" ~/gymtracker-backup.dump

# Spot-check
psql "$RENDER_DB_URL" -c "select (select count(*) from users) users, (select count(*) from workout_logs) workouts;"
```

`pg_dump` only reads the local database, so your local data is never modified. Keep the `.dump` file private and delete it when you're done; `*.dump` is gitignored.

### Step 3: Deploy the backend web service

1. Render Dashboard → **New → Blueprint**, select this repository. Render reads `render.yaml`.
2. When prompted, enter:
   - `DATABASE_URL`: the database's **Internal Database URL**
   - `GEMINI_API_KEY`: your Gemini key (optional; leave empty to use the built-in coaching engine)
3. Render generates `JWT_SECRET` and sets `CORS_ALLOWED_ORIGINS` from the Blueprint. Deploy.
4. Render builds the Docker image and only routes traffic once `GET /api/health` returns `200`. That endpoint returns `503` while PostgreSQL is unreachable.

**Render environment variables**

| Variable | Required | Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Internal Database URL of the Render PostgreSQL instance |
| `JWT_SECRET` | Yes | Long random string (Blueprint generates one). Never reuse a local/sample value |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://gym-tracker-six-tau.vercel.app` (comma-separate additional origins, no `*`) |
| `GEMINI_API_KEY` | No | Google Gemini API key for the AI coach |
| `PORT` | Auto | Injected by Render. Do not set |
| `ANALYTICS_GRPC_ADDR` | No | Defaults to `127.0.0.1:50051` (in-container service) |

Changing an environment variable on Render restarts the service; no rebuild is needed.

**Database migrations** run automatically at every startup (`createTables` and `seedExercises` in [`backend/db/db.go`](backend/db/db.go)). They only use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, idempotent category `UPDATE`s, and an upsert of the built-in exercise catalog by name. Nothing is dropped, truncated or deleted, so they are safe on an existing database and need no manual step. Run a single instance: two instances booting at the same moment against a brand-new database could race on table creation.

**Free tier note:** free web services spin down when idle; the first request afterwards can take up to about a minute while the service starts. The frontend waits up to 60 seconds before reporting a timeout.

### Step 4: Point the Vercel frontend at Render

1. Copy the service URL shown at the top of the Render service page (`https://<service-name>.onrender.com`).
2. Vercel → Project → **Settings → Environment Variables** → set `VITE_API_URL` to that URL (no trailing `/api` needed) for **Production** (and Preview if used).
3. **Redeploy** (Deployments → latest → Redeploy). Vite inlines `VITE_API_URL` at build time, so the change has no effect until a new build runs. The site URL `https://gym-tracker-six-tau.vercel.app` stays the same.

### Step 5: Verify

```bash
API=https://<service-name>.onrender.com

curl -i "$API/api/health"         # 200 {"status":"ok","database":"ok",...}

curl -si -X OPTIONS "$API/api/auth/login" \
  -H 'Origin: https://gym-tracker-six-tau.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -i access-control-allow-origin
```

Then open the Vercel site with DevTools → Network: `POST https://<service-name>.onrender.com/api/auth/login` should return `401` for a wrong password and `200` for valid credentials. If you did not migrate data, register a new account first.

### Backend Tests
```bash
cd backend
go vet ./... && go test ./...
```

### Frontend Tests
Uses Node's built-in test runner with native TypeScript support (Node.js 22.18+).
```bash
cd frontend
npm test
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
