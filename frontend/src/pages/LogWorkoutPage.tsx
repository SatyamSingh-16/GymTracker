import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercisesApi, workoutsApi } from '../api/endpoints';
import type { Exercise } from '../types';
import { Dumbbell, Plus, Trash2, Calendar, FileText, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface SetInput {
  exercise_id: number;
  set_number: number;
  reps: number;
  weight_kg: number;
}

export const LogWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Form State
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState<SetInput[]>([
    { exercise_id: 1, set_number: 1, reps: 10, weight_kg: 60 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await exercisesApi.getAll();
        setExercises(data || []);
        if (data && data.length > 0 && sets[0].exercise_id === 1 && !data.find((e) => e.id === 1)) {
          setSets([{ exercise_id: data[0].id, set_number: 1, reps: 10, weight_kg: 60 }]);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchCatalog();
  }, []);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        exercise_id: lastSet ? lastSet.exercise_id : (exercises[0]?.id || 1),
        set_number: sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight_kg: lastSet ? lastSet.weight_kg : 60,
      },
    ]);
  };

  const removeSet = (index: number) => {
    if (sets.length === 1) {
      alert('A workout must have at least one set.');
      return;
    }
    const updated = sets
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, set_number: idx + 1 }));
    setSets(updated);
  };

  const updateSet = (index: number, field: keyof SetInput, value: number) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sets.length === 0) {
      setError('Please add at least one set to your workout.');
      return;
    }

    setSubmitting(true);

    try {
      await workoutsApi.create({
        workout_date: workoutDate,
        notes,
        sets,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save workout session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick total volume calculation
  const currentVolume = sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span>Log Workout Session</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Record exercises, reps, and weights to calculate your estimated 1RM and progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-dark-800 border border-slate-800 text-right">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Session Volume
            </p>
            <p className="text-lg font-extrabold text-brand-emerald font-mono">
              {Math.round(currentVolume).toLocaleString()} kg
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Session Metadata Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              <span>Workout Date</span>
            </label>
            <input
              type="date"
              required
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-cyan" />
              <span>Session Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chest focus, felt explosive on 3rd set"
              className="w-full px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-emerald text-sm"
            />
          </div>
        </div>

        {/* Dynamic Sets Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Sets & Reps</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 font-mono">
                {sets.length} total
              </span>
            </h2>
            <button
              type="button"
              onClick={addSet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-dark-900 bg-brand-emerald hover:bg-emerald-400 transition-colors shadow-glow-emerald"
            >
              <Plus className="w-4 h-4" />
              <span>Add Next Set</span>
            </button>
          </div>

          {/* Sets Rows */}
          <div className="space-y-3">
            {sets.map((set, idx) => {
              const estimated1RM =
                set.reps > 0 && set.weight_kg > 0
                  ? (set.weight_kg * (1 + set.reps / 30)).toFixed(1)
                  : '0';

              return (
                <div
                  key={idx}
                  className="glass-card p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="w-8 h-8 rounded-lg bg-dark-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-brand-emerald shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Exercise Select */}
                    <div className="flex-1 md:w-64">
                      <select
                        value={set.exercise_id}
                        onChange={(e) =>
                          updateSet(idx, 'exercise_id', parseInt(e.target.value, 10))
                        }
                        disabled={loadingExercises}
                        className="w-full px-3 py-2 bg-dark-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      >
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reps & Weight Inputs */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium">Reps</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(idx, 'reps', Math.max(1, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-20 px-3 py-2 bg-dark-800 border border-slate-700 rounded-xl text-white text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium">kg</label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={1000}
                        required
                        value={set.weight_kg}
                        onChange={(e) =>
                          updateSet(idx, 'weight_kg', Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        className="w-24 px-3 py-2 bg-dark-800 border border-slate-700 rounded-xl text-white text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      />
                    </div>

                    {/* Live 1RM Badge */}
                    <div
                      className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-lg bg-dark-800/80 border border-slate-800 min-w-[80px]"
                      title="Estimated 1-Rep Max via Epley formula: Weight * (1 + Reps/30)"
                    >
                      <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-brand-cyan" /> 1RM
                      </span>
                      <span className="text-xs font-bold text-brand-cyan font-mono">
                        {estimated1RM} kg
                      </span>
                    </div>

                    {/* Remove Set Button */}
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Set Button at bottom */}
          <button
            type="button"
            onClick={addSet}
            className="w-full py-3 border-2 border-dashed border-slate-800 hover:border-brand-emerald/40 rounded-2xl text-slate-400 hover:text-brand-emerald flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:bg-brand-emerald/5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Set</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-dark-900 bg-brand-emerald hover:bg-emerald-400 transition-all shadow-glow-emerald disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Save Workout</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
