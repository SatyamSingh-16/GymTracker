package handlers

import (
	"encoding/json"
	"net/http"

	"gymtracker-backend/grpcclient"
	"gymtracker-backend/utils"
)

type OneRMInput struct {
	WeightKg float64 `json:"weight_kg"`
	Reps     int     `json:"reps"`
}

// Calculate1RMHandler receives JSON from the frontend, calls the gRPC microservice, and returns JSON
func Calculate1RMHandler(w http.ResponseWriter, r *http.Request) {
	var input OneRMInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body: expected weight_kg and reps")
		return
	}

	if input.WeightKg <= 0 || input.Reps <= 0 {
		utils.Error(w, http.StatusBadRequest, "weight_kg and reps must both be positive numbers")
		return
	}

	// Call gRPC Microservice via binary protocol
	res, err := grpcclient.Calculate1RM(input.WeightKg, input.Reps)
	if err != nil {
		utils.Error(w, http.StatusServiceUnavailable, "Analytics service currently unavailable: "+err.Error())
		return
	}

	// Send JSON response back to the browser
	utils.JSON(w, http.StatusOK, map[string]any{
		"epley_1rm":    res.GetEpley_1Rm(),
		"brzycki_1rm":  res.GetBrzycki_1Rm(),
		"lombardi_1rm": res.GetLombardi_1Rm(),
		"average_1rm":  res.GetAverage_1Rm(),
		"training_zones": map[string]float64{
			"heavy_strength_90": res.GetTrainingZones().GetHeavyStrength_90(),
			"hypertrophy_75":   res.GetTrainingZones().GetHypertrophy_75(),
			"endurance_60":     res.GetTrainingZones().GetEndurance_60(),
		},
	})
}
