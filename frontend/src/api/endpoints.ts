import { request } from './client';
import type {
  AuthResponse,
  User,
  Exercise,
  WorkoutLog,
  CreateWorkoutPayload,
  ProgressDataPoint,
} from '../types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),
};

export const exercisesApi = {
  getAll: () => request<Exercise[]>('/exercises'),
  getById: (id: number) => request<Exercise>(`/exercises/${id}`),
};

export const workoutsApi = {
  create: (data: CreateWorkoutPayload) =>
    request<WorkoutLog>('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => request<WorkoutLog[]>('/workouts'),

  getById: (id: number) => request<WorkoutLog>(`/workouts/${id}`),

  delete: (id: number) =>
    request<{ message: string }>(`/workouts/${id}`, {
      method: 'DELETE',
    }),
};

export const progressApi = {
  getForExercise: (exerciseId: number) =>
    request<ProgressDataPoint[]>(`/progress/${exerciseId}`),
};

export interface AICoachResponse {
  reply: string;
  source: string;
  suggested_prompts: string[];
  related_exercises?: string[];
}

export const aiApi = {
  chat: (data: { message: string; history?: { role: string; content: string }[] }) =>
    request<AICoachResponse>('/ai/coach', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

