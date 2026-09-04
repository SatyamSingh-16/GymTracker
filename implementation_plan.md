# Implementation Plan: Phase 3 - Modern Frontend Web Application (Vite + React + Tailwind v3)

## Goal Description
Build a modern, responsive, dark-mode-first web frontend for **GymTracker** using **Vite + React + TypeScript** and **Tailwind CSS v3**. The application will connect directly to the Go REST API backend (`http://localhost:8080/api`) to deliver authentication, a rich dashboard, an interactive workout logger with live 1RM feedback, an exercise catalog browser, and progress analytics with interactive charts.

---

## 🎨 Design System & Aesthetics Plan
- **Theme**: Premium obsidian dark mode (`#0a0e17` / `#111827` surface) with high-energy athletic accents (Electric Emerald `#10b981` & Cyan `#06b6d4`).
- **Typography**: Clean typography utilizing `Inter` / `Outfit` with crisp hierarchy.
- **Glassmorphism & Depth**: Subtle borders (`border-slate-800/80`), backdrop blur, and card elevation.
- **Micro-interactions**: Smooth transitions on set additions, interactive stat cards, toast notifications for errors and success, and responsive charts.

---

## 🏛️ Architecture & Component Hierarchy

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts         # Axios/Fetch wrapper with JWT auto-injection & interceptors
│   │   ├── auth.ts           # Login, register, getMe calls
│   │   ├── exercises.ts      # Exercise catalog calls
│   │   ├── workouts.ts       # Log workout, get workouts, delete workout
│   │   └── progress.ts       # Progress & 1RM analytics calls
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state provider (token, user, login, logout, isAuthenticated)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx    # Header with logo, navigation links, user profile & logout
│   │   │   └── ProtectedRoute.tsx # Route guard redirecting unauthenticated users to /login
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── StatCard.tsx  # KPI cards with icons and trend badges
│   │   │   └── Toast.tsx     # Animated feedback notifications
│   │   ├── workouts/
│   │   │   ├── SetRow.tsx    # Dynamic single set row (set #, reps, weight_kg, live 1RM preview, delete)
│   │   │   └── WorkoutCard.tsx # Summary card for logged workout sessions
│   │   └── analytics/
│   │       └── ProgressChart.tsx # Recharts Line/Area chart for 1RM and volume
│   ├── pages/
│   │   ├── LoginPage.tsx     # Sleek sign-in form with error feedback
│   │   ├── RegisterPage.tsx  # Sign-up form with password validation
│   │   ├── DashboardPage.tsx # Overview KPIs, streak, recent workouts, quick log shortcut
│   │   ├── LogWorkoutPage.tsx# Dynamic multi-set workout builder
│   │   ├── ExercisesPage.tsx # Filterable catalog with search & category pills
│   │   └── ProgressPage.tsx  # Interactive exercise analytics & 1RM trend graph
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces mirroring Go DTOs & models
│   ├── App.tsx               # Client-side router & layout container
│   ├── index.css             # Tailwind base, components, utilities, and custom variables
│   └── main.tsx              # React DOM entrypoint
├── index.html                # HTML entrypoint with metadata and Google Fonts
├── tailwind.config.js        # Tailwind v3 theme configuration
└── vite.config.ts            # Vite proxy to backend port :8080
```

---

## Proposed Implementation Steps

### Step 1: Scaffold Vite Project & Install Dependencies
1. Run `npx -y create-vite@latest frontend --template react-ts --no-interactive`.
2. Install dependencies:
   - `tailwindcss@^3.4.0`, `postcss`, `autoprefixer`
   - `lucide-react` (icons)
   - `recharts` (analytics charts)
   - `react-router-dom` (routing)
3. Configure `tailwind.config.js`, `postcss.config.js`, and `vite.config.ts` (with API proxy to `http://localhost:8080`).

### Step 2: Types, API Layer & Auth State
1. **`types/index.ts`**: TypeScript definitions matching Go models (`User`, `Exercise`, `WorkoutLog`, `WorkoutSet`, `ProgressDataPoint`).
2. **`api/client.ts`**: HTTP client with `Authorization: Bearer <token>` automatic header injection.
3. **`context/AuthContext.tsx`**: Manages auth lifecycle (`token`, `user`, `login`, `logout`), saves token in `localStorage`, and restores session on page reload via `GET /api/auth/me`.

### Step 3: Core Layout & Navigation
1. **`components/layout/Navbar.tsx`**: Modern responsive navigation bar with links to Dashboard, Log Workout, Exercises, Analytics, and a User Profile badge with Logout.
2. **`components/layout/ProtectedRoute.tsx`**: Route wrapper that redirects unauthenticated users to `/login`.

### Step 4: Authentication Pages
1. **`pages/LoginPage.tsx`**: High-conversion login screen with demo credentials shortcut, error handling, and redirect to dashboard.
2. **`pages/RegisterPage.tsx`**: Registration screen with email and password validation.

### Step 5: Dashboard Page (`/`)
1. Fetches current user profile and recent workouts from `GET /api/workouts`.
2. Displays KPI Stat Cards:
   - Total Workouts Logged
   - Total Volume Lifted (kg)
   - Recent Workout Cards with expandable set breakdowns.
3. Quick action button to "Log Today's Workout".

### Step 6: Interactive Workout Logger Page (`/log`)
1. Loads exercise catalog from `GET /api/exercises`.
2. Form fields:
   - Date picker (defaults to today).
   - Notes textarea.
   - Dynamic Sets Manager:
     - Select exercise.
     - Add Set button.
     - Each set includes: Set number, Reps, Weight (kg), and a **live calculated 1RM preview** (`weight * (1 + reps/30)`).
     - Remove set button.
3. Submits payload to `POST /api/workouts` and redirects to Dashboard with success toast.

### Step 7: Exercise Catalog Page (`/exercises`)
1. Fetches all exercises from `GET /api/exercises`.
2. Search input (filter by exercise name).
3. Category filters: `All`, `Chest`, `Back`, `Legs`, `Shoulders`, `Arms`, `Core`.
4. Equipment badges (`Barbell`, `Dumbbell`, `Machine`, `Bodyweight`).
5. Direct link on each card: "View Progress" or "Log Exercise".

### Step 8: Progress & Analytics Page (`/analytics`)
1. Exercise selector dropdown (e.g. Barbell Bench Press, Squat, Deadlift).
2. Fetches trend data from `GET /api/progress/{exercise_id}`.
3. Renders interactive **Recharts**:
   - **1RM Progression Curve**: Visualizes strength gains over time.
   - **Total Volume Bar/Area**: Visualizes workout density and work capacity over time.
4. Summary metrics: All-time Max Weight, All-time Best 1RM, Total Sessions.

---

## User Review Required

> [!IMPORTANT]
> The frontend project will be created in a new `frontend/` directory within the workspace. Your existing `backend/` and `docs/` directories remain completely untouched.

Please review the proposed architecture, components, and pages. Once approved, we will scaffold the app and build out the modules step by step.

---

## Verification Plan

### Automated Verification
1. `npm run build` inside `frontend/` to ensure 100% TypeScript compilation with zero errors.
2. `npm run lint` to verify code quality.

### Interactive Functional Verification
1. Start Go backend on `:8080`.
2. Start Vite dev server on `:3000` or `:5173`.
3. Test end-to-end user flow:
   - Register new user -> Token saved -> Redirect to Dashboard.
   - Browse exercise catalog with search and category filters.
   - Log a workout session with 3 sets of bench press and 3 sets of squats.
   - Check Dashboard to verify the new workout appears with total volume.
   - Visit Progress page to verify the 1RM curve and volume charts render accurately.
