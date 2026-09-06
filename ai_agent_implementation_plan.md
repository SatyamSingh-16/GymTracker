# AI Fitness Coach Agent — Complete Implementation Guide

This document outlines the complete architectural design, engineering decisions, and step-by-step implementation taken to integrate the **GymTracker AI Fitness Coach Agent** into the application.

---

## 1. Architectural Overview & Design Philosophy

The AI integration was designed with three foundational principles:
1. **Security & API Key Privacy**: LLM credentials (`GEMINI_API_KEY`) are kept strictly on the Go backend server, never exposed in frontend client bundles.
2. **Hybrid Intelligence Pipeline**:
   - **Live Cloud LLM Mode**: When a Google Gemini 1.5 Flash API key is provided, queries are processed by Google's state-of-the-art model with a 1-million-token context window.
   - **Autonomous Strength Knowledge Engine**: When running locally without an external API key or in offline/isolated environments, GymTracker activates a built-in biomechanics and training knowledge engine that provides structured, scientifically validated routines and volume analysis.
3. **Workout Context Awareness**: The backend automatically extracts the user’s recent workout history (total sessions, exercises logged, cumulative weight volume) and injects it into the prompt context so answers are tailored directly to the lifter.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND                                  │
│  • Floating AI Coach Trigger Button (Persistent glowing pill)               │
│  • Frosted Glassmorphism Chat Drawer (AICoachModal)                         │
│  • Quick-Prompt Starter Chips (Chest, Volume Analysis, Plateaus, Nutrition) │
│  • Markdown Formatter (Bold headers, bullet lists, exercise tags)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST /api/ai/coach
                                       │ (Bearer JWT Token)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                              GO CHI BACKEND                                 │
│  • Auth Middleware: Validates JWT and retrieves authenticated user ID       │
│  • Context Builder: Queries recent workouts & exercise frequency            │
│  • Hybrid Router: Checks for GEMINI_API_KEY                                 │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │ If Key Set                          │ If No Key
┌───────────────────▼─────────────────┐   ┌───────────────▼───────────────────┐
│     Google Gemini 1.5 Flash API     │   │   GymTracker Knowledge Engine     │
│   • Multi-turn conversation         │   │   • Hypertrophy routines (Chest,  │
│   • Natural language generation     │   │     Back, Legs, Arms)             │
│   • Custom gym coach system prompt  │   │   • Real volume & sets analysis   │
└─────────────────────────────────────┘   │   • Progressive overload logic    │
                                          └───────────────────────────────────┘
```

---

## 2. Step-by-Step Implementation Breakdown

### Step 1: Backend Handler & Hybrid Intelligence (`backend/handlers/ai_handler.go`)
* **File created**: `backend/handlers/ai_handler.go`
* **Features implemented**:
  1. `AICoachChat(w, r)`: HTTP handler extracting the message and history from the client request.
  2. `buildUserContextSummary()`: Aggregates the lifter's last 14 days of workout logs into a concise prompt injection (`"User has logged 4 workouts, 168 kg total volume..."`).
  3. `callGeminiAPI()`: Native Go HTTP client invoking `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`.
  4. `generateKnowledgeBaseResponse()`: Intelligent fallback providing:
     - **Chest & Bench**: Targets sternal and clavicular heads via Incline DB Press, Flat Bench, Cable Flyes, and Weighted Dips with exact sets, reps, and cues.
     - **Back & Lats**: V-Taper routines targeting lats and rhomboids.
     - **Legs & Squats**: Balanced quad, hamstring (RDL), and unilateral glute programming.
     - **Plateaus & Strength**: 4-step progressive overload, deload week, and micro-loading guidelines.
     - **Volume Analysis**: Live calculation of total sessions and cumulative volume lifted.
     - **Nutrition**: Protein distribution (1.6–2.2g/kg), creatine monohydrate dosing, and hydration.

### Step 2: Route Registration (`backend/routes/routes.go`)
* Added `r.Post("/api/ai/coach", handlers.AICoachChat)` inside the protected router group.
* Protected by `customMiddleware.AuthMiddleware`, ensuring unauthenticated users cannot consume AI resources.

### Step 3: Environment Configuration (`backend/.env` & `backend/.env.example`)
* Documented `GEMINI_API_KEY=` for optional cloud LLM activation.

### Step 4: Frontend API Layer (`frontend/src/api/endpoints.ts`)
* Added `AICoachResponse` interface.
* Added `aiApi.chat({ message, history })` calling the `/api/ai/coach` endpoint using the authenticated request client.

### Step 5: Floating AI Coach Trigger (`frontend/src/components/ai/FloatingAITrigger.tsx`)
* Created a sleek, persistent floating pill in the bottom-right corner.
* Styled with frosted glass (`backdrop-blur-2xl bg-zinc-900/90`), subtle glowing hover aura, sparkles icon, and an animated green active status beacon.

### Step 6: Frosted Glass Chat Drawer (`frontend/src/components/ai/AICoachModal.tsx`)
* Designed a responsive slide-up modal / desktop drawer matching the application's minimalist dark glass theme.
* **Key capabilities**:
  - **Quick-Starter Chips**: One-tap prompt suggestions (*"Which is the best chest workout?"*, *"Analyze my workout volume"*, *"How to break a bench press plateau?"*).
  - **Custom Markdown Renderer**: Parses bold headers (`###`), bullet points, and numbered lists without heavy third-party bundle bloat.
  - **Dynamic Follow-Up Suggestions**: Every answer generates 3 relevant follow-up questions lifters frequently ask.
  - **Related Exercise Badges**: Displays tags for exercises discussed in the chat.
  - **Pulsing Thinking Indicator**: 3-dot animated loading feedback while calculating answers.
  - **Clear History Action**: Reset conversation at any point.

### Step 7: Global Integration (`frontend/src/App.tsx`)
* Connected `FloatingAITrigger` and `AICoachModal` globally inside `AppContent`.
* Conditionally rendered only when the user is logged in (`token !== null`).

---

## 3. How to Activate Google Gemini 1.5 Flash (Optional)

GymTracker works right out of the box with the built-in strength engine. If you want to enable Google Gemini for open-ended live chat:

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Open `backend/.env` and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```
3. Restart the Go backend:
   ```bash
   go run main.go
   ```
4. The AI Coach will automatically route questions through Gemini 1.5 Flash and tag responses with `Powered by Gemini 1.5 Flash (Live LLM)`.

---

## 4. Verification & Testing

* **Backend Compilation**: `go build ./...` passed with 0 errors.
* **API Test**: Verified `POST /api/ai/coach` via Python integration test with valid JWT authentication.
* **Frontend Compilation**: `npm run build` executed and passed TypeScript checks cleanly.
