import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workoutsApi } from '../api/endpoints';
import type { WorkoutLog } from '../types';
import { StatCard } from '../components/common/StatCard';
import { PlusCircle, Flame, Dumbbell, Trophy, Calendar, Trash2, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchWorkouts = async () => {
    try {
      const data = await workoutsApi.getAll();
      setWorkouts(data || []);
    } catch (err) {
      console.error('Failed fetching workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this workout log?')) return;

    setDeletingId(id);
    try {
      await workoutsApi.delete(id);
      setWorkouts(workouts.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert('Failed to delete workout. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // KPI Calculations
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((total, w) => {
    const workoutVol = (w.sets || []).reduce((sTot, s) => sTot + s.reps * s.weight_kg, 0);
    return total + workoutVol;
  }, 0);
  const totalSets = workouts.reduce((total, w) => total + (w.sets?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 mb-3">
            <Flame className="w-3.5 h-3.5" /> Athlete Command Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-brand-emerald">{user?.name}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Consistency breeds strength. Ready to log today's progress?
          </p>
        </div>
        <div>
          <Link
            to="/log"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-dark-900 bg-brand-emerald hover:bg-emerald-400 transition-all shadow-glow-emerald transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Log Today's Workout</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Workouts"
          value={loading ? '...' : totalWorkouts}
          subtitle="Completed gym sessions"
          icon={Dumbbell}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          glowClass="hover:border-brand-emerald/40"
        />
        <StatCard
          title="Total Volume"
          value={loading ? '...' : `${Math.round(totalVolume).toLocaleString()} kg`}
          subtitle="Cumulative weight moved"
          icon={Trophy}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          glowClass="hover:border-brand-cyan/40"
        />
        <StatCard
          title="Total Sets Recorded"
          value={loading ? '...' : totalSets}
          subtitle="Hard sets completed"
          icon={Flame}
          gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          glowClass="hover:border-purple-500/40"
        />
      </div>

      {/* Recent Workouts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-emerald" />
            <span>Recent Workout Logs</span>
          </h2>
          <span className="text-xs text-slate-400">
            Showing {workouts.length} recorded sessions
          </span>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-emerald/20 border-t-brand-emerald rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Loading your workout logs...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center space-y-4 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No workouts recorded yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Start building your strength journey by recording your very first set today.
            </p>
            <Link
              to="/log"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-emerald text-dark-900 hover:bg-emerald-400 transition-colors shadow-glow-emerald"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record First Workout</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {workouts.map((w) => {
              const sessionVolume = (w.sets || []).reduce(
                (sum, s) => sum + s.reps * s.weight_kg,
                0
              );

              return (
                <div
                  key={w.id}
                  className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-dark-800 border border-slate-700 text-xs font-semibold text-brand-emerald">
                          {w.workout_date}
                        </span>
                        <span className="text-xs text-slate-400">
                          {w.sets?.length || 0} sets
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(w.id)}
                        disabled={deletingId === w.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete workout log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {w.notes && (
                      <p className="text-sm text-slate-300 italic bg-dark-800/50 px-3 py-2 rounded-lg border border-slate-800/50">
                        "{w.notes}"
                      </p>
                    )}

                    {/* Sets Preview */}
                    <div className="space-y-1.5 pt-1">
                      {(w.sets || []).slice(0, 4).map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-md bg-dark-900/60 border border-slate-800/60"
                        >
                          <span className="font-medium text-slate-200 truncate max-w-[180px]">
                            {s.exercise_name || `Exercise #${s.exercise_id}`}
                          </span>
                          <span className="text-slate-400 font-mono">
                            Set {s.set_number}: {s.reps} reps @{' '}
                            <strong className="text-brand-cyan">{s.weight_kg} kg</strong>
                          </span>
                        </div>
                      ))}
                      {(w.sets?.length || 0) > 4 && (
                        <p className="text-[11px] text-slate-500 text-center">
                          +{w.sets.length - 4} more sets
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      Volume:{' '}
                      <strong className="text-white font-mono">
                        {Math.round(sessionVolume).toLocaleString()} kg
                      </strong>
                    </span>
                    <Link
                      to={`/analytics?exerciseId=${w.sets?.[0]?.exercise_id || 1}`}
                      className="text-brand-emerald hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
