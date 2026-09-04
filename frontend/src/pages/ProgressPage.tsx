import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { exercisesApi, progressApi } from '../api/endpoints';
import type { Exercise, ProgressDataPoint } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Trophy, Dumbbell, BarChart3, PlusCircle } from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExerciseId = parseInt(searchParams.get('exerciseId') || '1', 10);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<number>(initialExerciseId);
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch exercises catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await exercisesApi.getAll();
        setExercises(data || []);
        if (data && data.length > 0 && !data.find((e) => e.id === selectedId)) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error('Failed loading exercises:', err);
      }
    };

    fetchCatalog();
  }, []);

  // Fetch progress whenever selectedId changes
  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const data = await progressApi.getForExercise(selectedId);
        setProgressData(data || []);
      } catch (err) {
        console.error('Failed loading progress data:', err);
        setProgressData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedId) {
      fetchProgress();
    }
  }, [selectedId]);

  const handleExerciseChange = (newId: number) => {
    setSelectedId(newId);
    setSearchParams({ exerciseId: newId.toString() });
  };

  const currentExercise = exercises.find((e) => e.id === selectedId);

  // Peak metrics
  const peak1RM = progressData.length > 0
    ? Math.max(...progressData.map((d) => d.estimated_1rm || 0))
    : 0;

  const maxWeight = progressData.length > 0
    ? Math.max(...progressData.map((d) => d.max_weight || 0))
    : 0;

  const totalVolumeCumulative = progressData.reduce((acc, d) => acc + (d.total_volume || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Exercise Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Strength Analytics
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Progress & 1RM Progression
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your strength adaptations and volume over time using the Epley formula.
          </p>
        </div>

        {/* Dropdown to switch exercise */}
        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Select Exercise
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleExerciseChange(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              All-Time Peak 1RM
            </p>
            <h3 className="text-3xl font-extrabold text-brand-emerald mt-1 font-mono">
              {peak1RM > 0 ? `${peak1RM.toFixed(1)} kg` : '--'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Estimated 1-rep maximum
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-brand-emerald border border-emerald-500/20">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Heaviest Single Set
            </p>
            <h3 className="text-3xl font-extrabold text-brand-cyan mt-1 font-mono">
              {maxWeight > 0 ? `${maxWeight.toFixed(1)} kg` : '--'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Absolute weight loaded on bar
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-cyan-500/10 text-brand-cyan border border-cyan-500/20">
            <Dumbbell className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Cumulative Volume
            </p>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-1 font-mono">
              {totalVolumeCumulative > 0
                ? `${Math.round(totalVolumeCumulative).toLocaleString()} kg`
                : '--'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Across all recorded sessions
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {loading ? (
        <div className="glass-card p-16 rounded-2xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-emerald/20 border-t-brand-emerald rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Computing exercise progression...</p>
        </div>
      ) : progressData.length === 0 ? (
        <div className="glass-card p-16 rounded-2xl text-center space-y-4 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">
            No data points for {currentExercise?.name || 'this exercise'}
          </h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Log your first set of this exercise to begin generating progression curves and 1RM metrics.
          </p>
          <Link
            to="/log"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-emerald text-dark-900 hover:bg-emerald-400 transition-colors shadow-glow-emerald"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log {currentExercise?.name || 'Exercise'} Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1RM Trend Chart */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Estimated 1RM Progression</h3>
                <p className="text-xs text-slate-400">Calculated via Epley formula over time</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                1RM (kg)
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '12px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="estimated_1rm"
                    name="Est. 1RM"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#color1RM)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Per Session Chart */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Workout Volume Density</h3>
                <p className="text-xs text-slate-400">Total weight moved per session (Reps × kg)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Volume (kg)
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '12px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="total_volume"
                    name="Session Volume"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
