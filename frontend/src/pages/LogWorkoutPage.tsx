import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exercisesApi, workoutsApi } from '../api/endpoints';
import type { Exercise } from '../types';
import {
  Dumbbell,
  Plus,
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap,
  Timer,
  Layers,
  Filter,
} from 'lucide-react';

interface SetInput {
  exercise_id: number;
  set_number: number;
  reps: number;
  weight_kg: number;
}

const PRESET_WORKOUT_TYPES = [
  'Back',
  'Chest',
  'Legs',
  'Shoulders',
  'Arms',
  'Back & Biceps',
  'Chest & Triceps',
  'Core',
  'Push Day',
  'Pull Day',
  'Legs Day',
  'Full Body',
  'Custom',
];

const getMatchingExercises = (type: string, all: Exercise[]): Exercise[] => {
  const t = type.toLowerCase();
  return all.filter((ex) => {
    const cat = ex.category.toLowerCase();
    const name = ex.name.toLowerCase();

    if (t === 'back') return cat === 'back';
    if (t === 'chest') return cat === 'chest';
    if (t === 'legs' || t === 'legs day') return cat === 'legs';
    if (t === 'shoulders') return cat === 'shoulders';
    if (t === 'arms') return cat === 'arms';
    if (t === 'core') return cat === 'core';
    if (t === 'back & biceps') {
      return cat === 'back' || (cat === 'arms' && (name.includes('curl') || name.includes('bicep')));
    }
    if (t === 'chest & triceps') {
      return (
        cat === 'chest' ||
        (cat === 'arms' &&
          (name.includes('tricep') ||
            name.includes('dip') ||
            name.includes('skull') ||
            name.includes('press')))
      );
    }
    if (t === 'push day') {
      return (
        cat === 'chest' ||
        cat === 'shoulders' ||
        (cat === 'arms' &&
          (name.includes('tricep') ||
            name.includes('dip') ||
            name.includes('skull') ||
            name.includes('press')))
      );
    }
    if (t === 'pull day') {
      return cat === 'back' || (cat === 'arms' && (name.includes('curl') || name.includes('bicep')));
    }

    return cat.includes(t) || t.includes(cat);
  });
};

export const LogWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Form State
  const [workoutDate, setWorkoutDate] = useState(() => dateParam || new Date().toISOString().split('T')[0]);
  const [workoutType, setWorkoutType] = useState('Back');
  const [customWorkoutType, setCustomWorkoutType] = useState('');
  const [showAllExercises, setShowAllExercises] = useState(false);
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
        if (data && data.length > 0) {
          const initialMatches = getMatchingExercises('Back', data);
          const initialEx = initialMatches[0] || data[0];
          const isTime = initialEx.is_time_based || initialEx.name.toLowerCase().includes('plank');
          setSets([
            {
              exercise_id: initialEx.id,
              set_number: 1,
              reps: isTime ? 60 : 10,
              weight_kg: isTime ? 0 : 60,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchCatalog();
  }, []);

  // Filter exercises based on selected split
  const filteredExercises = useMemo(() => {
    if (showAllExercises || workoutType === 'Full Body' || workoutType === 'Custom') {
      return exercises;
    }
    const matches = getMatchingExercises(workoutType, exercises);
    return matches.length > 0 ? matches : exercises;
  }, [exercises, workoutType, showAllExercises]);

  const handleWorkoutTypeSelect = (newType: string) => {
    setWorkoutType(newType);
    setShowAllExercises(false);

    if (newType !== 'Full Body' && newType !== 'Custom') {
      const matches = getMatchingExercises(newType, exercises);
      if (matches.length > 0) {
        const firstMatch = matches[0];
        const isTime = firstMatch.is_time_based || firstMatch.name.toLowerCase().includes('plank');

        setSets((prev) =>
          prev.map((s, idx) => {
            const matchesCurrent = matches.some((m) => m.id === s.exercise_id);
            if (!matchesCurrent && idx === 0) {
              return {
                ...s,
                exercise_id: firstMatch.id,
                reps: isTime ? 60 : 10,
                weight_kg: isTime ? 0 : 60,
              };
            }
            return s;
          })
        );
      }
    }
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const fallbackId = filteredExercises[0]?.id || exercises[0]?.id || 1;
    const targetExId = lastSet ? lastSet.exercise_id : fallbackId;
    const ex = exercises.find((e) => e.id === targetExId);
    const isTime = ex?.is_time_based || ex?.name.toLowerCase().includes('plank');

    setSets([
      ...sets,
      {
        exercise_id: targetExId,
        set_number: sets.length + 1,
        reps: lastSet ? lastSet.reps : (isTime ? 60 : 10),
        weight_kg: lastSet ? lastSet.weight_kg : (isTime ? 0 : 60),
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

  const updateExercise = (index: number, exerciseId: number) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    const isTime = ex?.is_time_based || ex?.name.toLowerCase().includes('plank');
    const updated = [...sets];
    const prevSet = updated[index];
    updated[index] = {
      ...prevSet,
      exercise_id: exerciseId,
      reps: isTime ? (prevSet.reps === 10 ? 60 : prevSet.reps) : (prevSet.reps === 60 ? 10 : prevSet.reps),
      weight_kg: isTime ? (prevSet.weight_kg === 60 ? 0 : prevSet.weight_kg) : (prevSet.weight_kg === 0 ? 60 : prevSet.weight_kg),
    };
    setSets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sets.length === 0) {
      setError('Please add at least one set to your workout.');
      return;
    }

    const effectiveWorkoutType =
      workoutType === 'Custom'
        ? (customWorkoutType.trim() || 'Custom Workout')
        : workoutType;

    setSubmitting(true);

    try {
      await workoutsApi.create({
        workout_date: workoutDate,
        workout_type: effectiveWorkoutType,
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

  // Session volume calculation (excludes pure time-based bodyweight exercises from multiplying seconds with kg)
  const currentVolume = sets.reduce((sum, s) => {
    const ex = exercises.find((e) => e.id === s.exercise_id);
    const isTime = ex?.is_time_based || ex?.name.toLowerCase().includes('plank');
    if (isTime) {
      return sum + (s.weight_kg > 0 ? s.weight_kg : 0);
    }
    return sum + s.reps * s.weight_kg;
  }, 0);

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card p-8 sm:p-10 rounded-[32px] border border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-slate-300 border border-white/15">
            <Dumbbell className="w-4 h-4 text-white" />
            <span>Interactive Workout Logger</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Log Workout Session
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Select workout category, record exercises, reps/time, and track your performance.
          </p>
        </div>
        <div className="shrink-0">
          <div className="px-6 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-right backdrop-blur-md">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Session Volume
            </p>
            <p className="text-2xl font-black text-white font-mono mt-0.5">
              {Math.round(currentVolume).toLocaleString()} kg
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm backdrop-blur-md">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Workout Category & Split Selector Card */}
        <div className="glass-card p-8 sm:p-10 rounded-[28px] border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span>Target Muscle / Workout Split</span>
            </label>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Dropdown will automatically show matching exercises
            </span>
          </div>

          {/* Quick Select Pills */}
          <div className="flex flex-wrap gap-2.5">
            {PRESET_WORKOUT_TYPES.map((type) => {
              const isSelected = workoutType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleWorkoutTypeSelect(type)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-black !text-black font-bold shadow-pill-white scale-105 btn-white'
                      : 'bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {workoutType === 'Custom' && (
            <div className="pt-2">
              <input
                type="text"
                required
                value={customWorkoutType}
                onChange={(e) => setCustomWorkoutType(e.target.value)}
                placeholder="Enter custom workout type (e.g. 'Glutes & Hamstrings', 'HIIT Circuit')"
                className="w-full px-5 py-3.5 glass-input rounded-2xl text-white placeholder-slate-500 text-sm"
              />
            </div>
          )}
        </div>

        {/* Session Metadata Card */}
        <div className="glass-card p-8 sm:p-10 rounded-[28px] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white" />
              <span>Workout Date</span>
            </label>
            <input
              type="date"
              required
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              className="w-full px-5 py-3.5 glass-input rounded-2xl text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              <span>Session Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focused on slow eccentrics, PR on 2nd set"
              className="w-full px-5 py-3.5 glass-input rounded-2xl text-white placeholder-slate-500 text-sm"
            />
          </div>
        </div>

        {/* Dynamic Sets Manager */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span>Sets & Reps</span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 font-mono">
                  {sets.length} total
                </span>
              </h2>

              {workoutType !== 'Full Body' && workoutType !== 'Custom' && (
                <button
                  type="button"
                  onClick={() => setShowAllExercises(!showAllExercises)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                  title="Toggle between split-specific exercises and full library"
                >
                  <Filter className="w-3 h-3 text-amber-300" />
                  <span>
                    {showAllExercises
                      ? `Showing All (${exercises.length})`
                      : `${workoutType} (${filteredExercises.length})`}
                  </span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={addSet}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white btn-white self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-black !text-black" />
              <span className="text-black !text-black font-bold">Add Next Set</span>
            </button>
          </div>

          {/* Sets Rows */}
          <div className="space-y-3.5">
            {sets.map((set, idx) => {
              const selectedEx = exercises.find((e) => e.id === set.exercise_id);
              const isTimeBased =
                selectedEx?.is_time_based ||
                selectedEx?.name.toLowerCase().includes('plank');

              const estimated1RM =
                !isTimeBased && set.reps > 0 && set.weight_kg > 0
                  ? (set.weight_kg * (1 + set.reps / 30)).toFixed(1)
                  : '0';

              const formattedHoldTime =
                set.reps >= 60
                  ? `${Math.floor(set.reps / 60)}m ${set.reps % 60}s`
                  : `${set.reps}s`;

              return (
                <div
                  key={idx}
                  className="glass-card p-5 sm:p-6 rounded-[24px] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-white/20"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center font-mono font-bold text-sm text-white shrink-0 shadow-sm">
                      #{idx + 1}
                    </span>

                    {/* Filtered Exercise Select */}
                    <div className="flex-1 md:w-72">
                      <select
                        value={set.exercise_id}
                        onChange={(e) => {
                          if (e.target.value === '__ALL__') {
                            setShowAllExercises(true);
                            return;
                          }
                          updateExercise(idx, parseInt(e.target.value, 10));
                        }}
                        disabled={loadingExercises}
                        className="w-full px-4 py-3 glass-input rounded-2xl text-white text-sm"
                      >
                        {filteredExercises.map((ex) => (
                          <option key={ex.id} value={ex.id} className="bg-dark-900 text-white">
                            {ex.name} ({ex.category})
                          </option>
                        ))}
                        {!showAllExercises && workoutType !== 'Full Body' && workoutType !== 'Custom' && (
                          <option value="__ALL__" className="bg-dark-900 text-amber-300 font-bold">
                            🔍 Show all {exercises.length} exercises...
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Reps/Time & Weight Inputs */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    {/* Time (for Plank/isometric) vs Reps */}
                    {isTimeBased ? (
                      <div className="flex items-center gap-2.5">
                        <label className="text-xs sm:text-sm text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          <span>Time (s)</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={3600}
                          required
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(idx, 'reps', Math.max(1, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-24 px-3 py-2.5 glass-input rounded-2xl text-white text-center font-mono text-sm sm:text-base font-bold border-amber-400/40"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <label className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">
                          Reps
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          required
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(idx, 'reps', Math.max(1, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-24 px-3 py-2.5 glass-input rounded-2xl text-white text-center font-mono text-sm sm:text-base font-bold"
                        />
                      </div>
                    )}

                    {/* Weight Input */}
                    <div className="flex items-center gap-2.5">
                      <label className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-wider">
                        {isTimeBased ? '+kg (opt)' : 'kg'}
                      </label>
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
                        className="w-28 px-3 py-2.5 glass-input rounded-2xl text-white text-center font-mono text-sm sm:text-base font-bold"
                      />
                    </div>

                    {/* Live Metric Badge */}
                    {isTimeBased ? (
                      <div
                        className="hidden sm:flex flex-col items-center px-4 py-2 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 min-w-[95px]"
                        title="Isometric hold duration"
                      >
                        <span className="text-[10px] text-amber-300 font-bold uppercase flex items-center gap-1">
                          <Timer className="w-3 h-3 text-amber-300" /> Hold
                        </span>
                        <span className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {formattedHoldTime}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="hidden sm:flex flex-col items-center px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 min-w-[95px]"
                        title="Estimated 1-Rep Max via Epley formula: Weight * (1 + Reps/30)"
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-white" /> 1RM
                        </span>
                        <span className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {estimated1RM} kg
                        </span>
                      </div>
                    )}

                    {/* Remove Set Button */}
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                      title="Remove set"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Set Button */}
          <button
            type="button"
            onClick={addSet}
            className="w-full py-4 border-2 border-dashed border-white/15 hover:border-white/30 rounded-[24px] text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm sm:text-base font-semibold transition-all hover:bg-white/[0.03]"
          >
            <Plus className="w-5 h-5" />
            <span>Add Another Set</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-5 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3.5 rounded-full text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2.5 px-9 py-4 rounded-full font-bold text-base text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white disabled:opacity-50 btn-white"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-black !text-black" />
                <span className="text-black !text-black font-bold">Save Workout</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
