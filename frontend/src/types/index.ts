export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  equipment: string;
  is_time_based?: boolean;
}

export interface WorkoutSet {
  id?: number;
  workout_log_id?: number;
  exercise_id: number;
  exercise_name?: string;
  set_number: number;
  reps: number;
  weight_kg: number;
}

export interface WorkoutLog {
  id: number;
  user_id: number;
  workout_date: string;
  workout_type?: string;
  notes: string;
  created_at: string;
  sets: WorkoutSet[];
}

export interface CreateWorkoutPayload {
  workout_date: string;
  workout_type?: string;
  notes: string;
  sets: {
    exercise_id: number;
    set_number: number;
    reps: number;
    weight_kg: number;
  }[];
}

export interface ProgressDataPoint {
  date: string;
  max_weight: number;
  estimated_1rm: number;
  total_volume: number;
}
