package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	customMiddleware "gymtracker-backend/middleware"
	"gymtracker-backend/models"
	"gymtracker-backend/repository"
	"gymtracker-backend/utils"
)

type AICoachRequest struct {
	Message string        `json:"message"`
	History []ChatMessage `json:"history,omitempty"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AICoachResponse struct {
	Reply            string   `json:"reply"`
	Source           string   `json:"source"`
	SuggestedPrompts []string `json:"suggested_prompts"`
	RelatedExercises []string `json:"related_exercises,omitempty"`
}

// AICoachChat handles interactive AI fitness coaching requests
func AICoachChat(w http.ResponseWriter, r *http.Request) {
	userID, ok := customMiddleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req AICoachRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	msg := strings.TrimSpace(req.Message)
	if msg == "" {
		utils.Error(w, http.StatusBadRequest, "Message cannot be empty")
		return
	}

	// Fetch recent workouts for context
	recentWorkouts, _ := repository.GetUserWorkouts(userID)
	contextSummary := buildUserContextSummary(recentWorkouts)

	// Check if Gemini API key is configured
	geminiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if geminiKey != "" {
		reply, err := callGeminiAPI(r.Context(), geminiKey, msg, req.History, contextSummary)
		if err == nil && reply != "" {
			utils.JSON(w, http.StatusOK, AICoachResponse{
				Reply:            reply,
				Source:           "Gemini 1.5 Flash (Live LLM)",
				SuggestedPrompts: generateDynamicFollowups(msg),
				RelatedExercises: detectRelatedExercises(msg),
			})
			return
		}
		// If Gemini failed or timed out, gracefully fall through to built-in knowledge engine
	}

	// Built-in Intelligent Fitness Knowledge & Analysis Engine
	reply, related, followups := generateKnowledgeBaseResponse(msg, recentWorkouts)
	utils.JSON(w, http.StatusOK, AICoachResponse{
		Reply:            reply,
		Source:           "GymTracker Strength Engine",
		SuggestedPrompts: followups,
		RelatedExercises: related,
	})
}

func buildUserContextSummary(workouts []models.WorkoutLog) string {
	if len(workouts) == 0 {
		return "User has no recorded workouts yet. They are starting their fitness journey."
	}

	totalSessions := len(workouts)
	recentDays := 0
	exerciseCounts := make(map[string]int)
	var totalVolume float64

	cutoff := time.Now().AddDate(0, 0, -14)
	for _, w := range workouts {
		wDate, err := time.Parse("2006-01-02", w.WorkoutDate)
		if err == nil && wDate.After(cutoff) {
			recentDays++
		}
		for _, s := range w.Sets {
			exerciseCounts[s.ExerciseName]++
			totalVolume += float64(s.Reps) * s.WeightKG
		}
	}

	topExercises := []string{}
	for ex := range exerciseCounts {
		topExercises = append(topExercises, ex)
		if len(topExercises) >= 5 {
			break
		}
	}

	return fmt.Sprintf("User has logged %d total workout sessions (%d in last 14 days). Total logged volume: %.0f kg. Frequent exercises: %s.",
		totalSessions, recentDays, totalVolume, strings.Join(topExercises, ", "))
}

func callGeminiAPI(ctx context.Context, apiKey, userMsg string, history []ChatMessage, userContext string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)

	systemPrompt := fmt.Sprintf(`You are "GymTracker Coach", an elite certified strength & conditioning specialist (CSCS) and sports nutrition consultant.
You provide evidence-based, practical lifting advice, routine designs, biomechanics cues, and recovery guidance.
Format your responses beautifully with Markdown:
- Use bold headers (###)
- Use bullet points for exercise lists, sets x reps, and rest intervals
- Keep it encouraging, concise, and focused on hypertrophy and strength.
User's Gym Context: %s`, userContext)

	type Part struct {
		Text string `json:"text"`
	}
	type Content struct {
		Role  string `json:"role,omitempty"`
		Parts []Part `json:"parts"`
	}
	type SystemInstruction struct {
		Parts []Part `json:"parts"`
	}
	type GeminiRequest struct {
		SystemInstruction SystemInstruction `json:"system_instruction"`
		Contents          []Content         `json:"contents"`
	}

	contents := []Content{}
	for _, h := range history {
		role := "user"
		if h.Role == "assistant" {
			role = "model"
		}
		contents = append(contents, Content{
			Role:  role,
			Parts: []Part{{Text: h.Content}},
		})
	}
	contents = append(contents, Content{
		Role:  "user",
		Parts: []Part{{Text: userMsg}},
	})

	payload := GeminiRequest{
		SystemInstruction: SystemInstruction{
			Parts: []Part{{Text: systemPrompt}},
		},
		Contents: contents,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini api error (status %d): %s", resp.StatusCode, string(respBody))
	}

	type Candidate struct {
		Content struct {
			Parts []Part `json:"parts"`
		} `json:"content"`
	}
	type GeminiResponse struct {
		Candidates []Candidate `json:"candidates"`
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		return geminiResp.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("no response candidates returned from gemini")
}

func generateKnowledgeBaseResponse(query string, workouts []models.WorkoutLog) (string, []string, []string) {
	q := strings.ToLower(query)

	// 1. Chest Workout questions
	if strings.Contains(q, "chest") || strings.Contains(q, "bench") || strings.Contains(q, "pec") {
		reply := `### 🏆 The Ultimate Hypertrophy Chest Routine

To maximize chest growth, you must target both the **sternal head** (mid/lower pecs) and the **clavicular head** (upper pecs) through multiple angles and resistance profiles:

1. **Incline Dumbbell Press (30° Angle)**
   * **Sets & Reps:** 3–4 sets × 8–10 reps
   * **Focus:** Targets upper chest fibers with greater range of motion than barbells. Bring elbows down at ~45° to protect rotator cuffs.
2. **Flat Barbell or Dumbbell Bench Press**
   * **Sets & Reps:** 3 sets × 6–8 reps
   * **Focus:** Primary heavy mechanical tension builder. Maintain retracted scapula and controlled 2-second eccentrics.
3. **Cable Chest Flyes (Mid to High Pulley)**
   * **Sets & Reps:** 3 sets × 12–15 reps
   * **Focus:** Provides peak contraction at full adduction where free weights lose tension. Squeeze hard at midline.
4. **Weighted Dips or Decline Push-ups**
   * **Sets & Reps:** 3 sets to near failure (RPE 9)
   * **Focus:** Torso tilted 30° forward to emphasize the lower pec line and stretch reflex.

💡 **Coach Tip:** Rest 2–3 minutes on compound presses and 60–90 seconds on flyes for maximum muscle protein synthesis.`

		related := []string{"Barbell Bench Press", "Incline Dumbbell Press", "Chest Fly", "Dips"}
		followups := []string{
			"How many sets per week should I train chest?",
			"How to fix bench press shoulder pain?",
			"What is the best triceps exercise to pair with chest?",
		}
		return reply, related, followups
	}

	// 2. Workout Volume / Analysis
	if strings.Contains(q, "analyze") || strings.Contains(q, "volume") || strings.Contains(q, "history") || strings.Contains(q, "my workout") {
		if len(workouts) == 0 {
			return `### 📊 Workout Analysis

You haven't logged any workouts in GymTracker yet! 

* Head over to the **Log Workout** page or tap **Log Today's Workout** on your Dashboard.
* Once you log a few sessions, I will analyze your weekly volume, frequency, and muscle recovery balance right here.`,
				[]string{"Barbell Squat", "Barbell Bench Press", "Conventional Deadlift"},
				[]string{"Which workout split is best for beginners?", "Best exercises for muscle building?"}
		}

		var totalSets int
		var totalVolume float64
		exerciseFreq := make(map[string]int)

		for _, w := range workouts {
			for _, s := range w.Sets {
				totalSets++
				totalVolume += float64(s.Reps) * s.WeightKG
				exerciseFreq[s.ExerciseName]++
			}
		}

		reply := fmt.Sprintf(`### 📊 Training Volume & Consistency Analysis

Based on your GymTracker records:
* **Recorded Sessions:** %d workouts
* **Total Working Sets:** %d sets completed
* **Cumulative Volume:** %.0f kg lifted

**Key Observations & Next Steps:**
* **Consistency:** You have established a solid baseline of tracked sets. Consistent tracking correlates with 40%% higher long-term strength gains.
* **Progressive Overload Recommendation:** Ensure you are increasing either load (+1–2.5 kg) or reps (+1 rep per set) every 2 weeks.
* **Volume Sweet Spot:** Aim for **10–20 direct working sets per muscle group per week** for optimal hypertrophy without overtraining.`,
			len(workouts), totalSets, totalVolume)

		related := []string{"Pull-ups", "Barbell Squat", "Overhead Press"}
		followups := []string{
			"How to break a strength plateau?",
			"What is a deload week and when should I take one?",
			"Which is the best chest workout?",
		}
		return reply, related, followups
	}

	// 3. Back / Pull workouts
	if strings.Contains(q, "back") || strings.Contains(q, "lat") || strings.Contains(q, "pull") || strings.Contains(q, "row") {
		reply := `### 🛡️ Complete Back & V-Taper Routine

For a thick, wide back, you need balanced vertical and horizontal pulling:

1. **Wide-Grip Pull-ups or Lat Pulldowns**
   * **Sets & Reps:** 4 sets × 8–10 reps
   * **Focus:** Drive your elbows down toward your back pockets to isolate the lats, avoiding excessive biceps pulling.
2. **Barbell Bent-Over Rows or Chest-Supported T-Bar Rows**
   * **Sets & Reps:** 4 sets × 6–8 reps
   * **Focus:** Mid-back thickness (rhomboids, traps, spinal erectors). Keep neutral spine.
3. **Seated Cable Rows (Neutral Grip)**
   * **Sets & Reps:** 3 sets × 10–12 reps
   * **Focus:** Full stretch forward, followed by driving scapulae together.
4. **Face Pulls or Rear Delt Cable Flyes**
   * **Sets & Reps:** 3 sets × 15–20 reps
   * **Focus:** Crucial for shoulder health, posture, and complete upper back development.`

		related := []string{"Pull-ups", "Lat Pulldown", "Bent-Over Row", "Deadlift"}
		followups := []string{
			"How to feel lats more during pull-ups?",
			"Best bicep exercise to finish pull day?",
			"Conventional deadlift vs Romanian deadlift?",
		}
		return reply, related, followups
	}

	// 4. Legs / Squats
	if strings.Contains(q, "leg") || strings.Contains(q, "squat") || strings.Contains(q, "quad") || strings.Contains(q, "hamstring") {
		reply := `### ⚡ High-Yield Leg Day Routine

Build functional lower-body strength and balanced quadriceps, hamstrings, and glutes:

1. **Barbell Back Squat or Hack Squat**
   * **Sets & Reps:** 4 sets × 6–8 reps
   * **Focus:** Primary quad & glute builder. Break at hips and knees simultaneously; hit parallel depth with control.
2. **Romanian Deadlift (RDL)**
   * **Sets & Reps:** 3 sets × 8–10 reps
   * **Focus:** Hamstrings & glute hypertrophy. Push hips backward until maximum hamstring stretch before returning.
3. **Bulgarian Split Squats (Dumbbell)**
   * **Sets & Reps:** 3 sets × 10–12 reps per leg
   * **Focus:** Unilateral stability, rectus femoris loading, eliminates strength imbalances.
4. **Standing Calf Raises & Leg Extensions Superset**
   * **Sets & Reps:** 3 sets × 15 reps (with 2-second peak pause)`

		related := []string{"Barbell Squat", "Romanian Deadlift", "Leg Press", "Calf Raise"}
		followups := []string{
			"How to squat deeper without lower back rounding?",
			"Best glute exercises for men and women?",
			"How to recover faster from intense leg workouts?",
		}
		return reply, related, followups
	}

	// 5. Plateau / Strength advice
	if strings.Contains(q, "plateau") || strings.Contains(q, "stuck") || strings.Contains(q, "stronger") || strings.Contains(q, "break") {
		reply := `### 🚀 4 Proven Steps to Break Any Lifting Plateau

If your lifts have stalled for more than 2–3 weeks, apply these physiological adjustments:

1. **Implement Micro-Loading**
   * Instead of jumping 5 kg, use small 0.5 kg or 1.25 kg fractional plates. Adding just +1 kg per week equals +52 kg in a year.
2. **Execute a 1-Week Deload**
   * Reduce total volume by 50% while maintaining moderate intensity for 7 days. This allows accumulated central nervous system (CNS) fatigue to dissipate.
3. **Vary Rep Ranges & Mechanical Angles**
   * If stuck at 5 reps on Barbell Bench, switch to 8–10 reps on Incline Dumbbell Press or pause reps for 4 weeks.
4. **Check Calorie & Sleep Deficits**
   * Muscle tissue cannot repair under chronic sleep deprivation (<7 hrs) or aggressive calorie deficits. Ensure 1.8g protein per kg of bodyweight.`

		related := []string{"Barbell Bench Press", "Overhead Press", "Barbell Squat"}
		followups := []string{
			"How does a deload week work?",
			"How much protein do I need per day?",
			"Best chest workout routine?",
		}
		return reply, related, followups
	}

	// 6. Nutrition & Diet
	if strings.Contains(q, "protein") || strings.Contains(q, "diet") || strings.Contains(q, "nutrition") || strings.Contains(q, "creatine") || strings.Contains(q, "calorie") {
		reply := `### 🥩 Evidence-Based Strength & Hypertrophy Nutrition

Your training is the stimulus; nutrition is the raw material:

* **Daily Protein Target:** Aim for **1.6 to 2.2 grams of protein per kilogram of bodyweight** (e.g., 75 kg lifter = 120–165g protein daily).
* **Protein Distribution:** Spread across 3–4 meals containing 30–45g of high-leucine protein (chicken breast, eggs, whey, Greek yogurt, lentils).
* **Creatine Monohydrate:** 3–5 grams taken daily at any time. It increases phosphocreatine stores in muscles, improving power output by 5–15%.
* **Hydration:** Consume 3–4 liters of water daily. Even a 2% dehydration level reduces 1RM muscular strength significantly.
* **Pre/Post Workout Timing:** Eat a balanced carb + protein meal 60–90 minutes before training to maximize glycogen availability.`

		related := []string{"Barbell Squat", "Conventional Deadlift", "Barbell Bench Press"}
		followups := []string{
			"Do I need to do a creatine loading phase?",
			"Should I cut or bulk first?",
			"Which is the best chest workout?",
		}
		return reply, related, followups
	}

	// Default general helpful coaching reply
	reply := fmt.Sprintf(`### 🏋️ GymTracker Fitness Coach

I'm your dedicated strength and conditioning assistant! You can ask me anything about:
* **Targeted Workouts** (e.g., *"Which is the best chest workout?"*, *"Best back routine for width"*)
* **Exercise Form & Cues** (e.g., *"How to bench press without shoulder pain"*)
* **Strength Progression** (e.g., *"How to break my bench press plateau"*, *"How to structure a deload"*)
* **Workout Splits** (Push/Pull/Legs vs Upper/Lower vs Full Body)
* **Nutrition & Supplements** (Protein requirements, Creatine timing, Recovery)

💡 *Tip: You can also ask me to **analyze my workout volume** to get personalized feedback based on your logged sessions!*`)

	related := []string{"Barbell Bench Press", "Pull-ups", "Barbell Squat"}
	followups := []string{
		"Which is the best chest workout?",
		"How to break a bench press plateau?",
		"Analyze my weekly workout balance",
		"What is the best workout split for 4 days a week?",
	}
	return reply, related, followups
}

func generateDynamicFollowups(query string) []string {
	q := strings.ToLower(query)
	if strings.Contains(q, "chest") {
		return []string{
			"How to target the upper chest effectively?",
			"Should I do dumbbell or barbell bench press?",
			"Best triceps movements to pair with chest?",
		}
	}
	if strings.Contains(q, "back") {
		return []string{
			"How to feel lats more during pull-ups?",
			"Bent-over rows vs Chest-supported rows?",
			"Best bicep exercise to finish pull day?",
		}
	}
	return []string{
		"Which is the best chest workout?",
		"How to break a lifting plateau?",
		"What is optimal daily protein intake?",
	}
}

func detectRelatedExercises(query string) []string {
	q := strings.ToLower(query)
	if strings.Contains(q, "chest") || strings.Contains(q, "bench") {
		return []string{"Barbell Bench Press", "Incline Dumbbell Press", "Chest Fly", "Dips"}
	}
	if strings.Contains(q, "back") || strings.Contains(q, "pull") {
		return []string{"Pull-ups", "Lat Pulldown", "Bent-Over Row", "Deadlift"}
	}
	if strings.Contains(q, "leg") || strings.Contains(q, "squat") {
		return []string{"Barbell Squat", "Romanian Deadlift", "Bulgarian Split Squat"}
	}
	return []string{"Barbell Bench Press", "Pull-ups", "Barbell Squat"}
}
