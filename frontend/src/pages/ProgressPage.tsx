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

  const peak1RM = progressData.length > 0
    ? Math.max(...progressData.map((d) => d.estimated_1rm || 0))
    : 0;

  const maxWeight = progressData.length > 0
    ? Math.max(...progressData.map((d) => d.max_weight || 0))
    : 0;

  const totalVolumeCumulative = progressData.reduce((acc, d) => acc + (d.total_volume || 0), 0);

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 space-y-10">
      {/* Header with Exercise Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 sm:p-10 rounded-[32px] border border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-slate-300 border border-white/15">
            <TrendingUp className="w-4 h-4 text-white" />
            <span>Strength & Adaptation Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Progress & 1RM Trends
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Track your strength adaptations and volume over time using the Epley formula.
          </p>
        </div>

        {/* Dropdown to switch exercise */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Movement
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleExerciseChange(parseInt(e.target.value, 10))}
            className="w-full px-5 py-3.5 glass-input rounded-2xl text-white text-sm focus:outline-none"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-dark-900 text-white">
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        <div className="glass-card glass-card-hover rounded-[26px] p-7 sm:p-8 border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              All-Time Peak 1RM
            </p>
            <h3 className="text-4xl sm:text-5xl font-black text-white mt-1 font-mono tracking-tight">
              {peak1RM > 0 ? `${peak1RM.toFixed(1)} kg` : '--'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Estimated 1-rep maximum
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white shadow-xl">
            <Trophy className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-[26px] p-7 sm:p-8 border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Heaviest Single Set
            </p>
            <h3 className="text-4xl sm:text-5xl font-black text-white mt-1 font-mono tracking-tight">
              {maxWeight > 0 ? `${maxWeight.toFixed(1)} kg` : '--'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Absolute weight loaded on bar
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white shadow-xl">
            <Dumbbell className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-[26px] p-7 sm:p-8 border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Cumulative Volume
            </p>
            <h3 className="text-4xl sm:text-5xl font-black text-white mt-1 font-mono tracking-tight">
              {totalVolumeCumulative > 0
                ? `${Math.round(totalVolumeCumulative).toLocaleString()} kg`
                : '--'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Across all recorded sessions
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white shadow-xl">
            <BarChart3 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {loading ? (
        <div className="glass-card p-20 rounded-[32px] text-center space-y-3">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Computing exercise progression...</p>
        </div>
      ) : progressData.length === 0 ? (
        <div className="glass-card p-20 rounded-[32px] text-center space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            No data points for {currentExercise?.name || 'this exercise'}
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Log your first set of this exercise to begin generating progression curves and 1RM metrics.
          </p>
          <Link
            to="/log"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white btn-white"
          >
            <PlusCircle className="w-4 h-4 text-black !text-black" />
            <span className="text-black !text-black font-bold">Log {currentExercise?.name || 'Exercise'} Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1RM Trend Chart */}
          <div className="glass-card p-8 sm:p-10 rounded-[32px] border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Estimated 1RM Progression</h3>
                <p className="text-xs sm:text-sm text-slate-400">Calculated via Epley formula over time</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                1RM (kg)
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 17, 23, 0.95)',
                      backdropFilter: 'blur(16px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="estimated_1rm"
                    name="Est. 1RM"
                    stroke="#ffffff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#color1RM)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Per Session Chart */}
          <div className="glass-card p-8 sm:p-10 rounded-[32px] border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Workout Volume Density</h3>
                <p className="text-xs sm:text-sm text-slate-400">Total weight moved per session (Reps × kg)</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                Volume (kg)
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 17, 23, 0.95)',
                      backdropFilter: 'blur(16px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Bar
                    dataKey="total_volume"
                    name="Session Volume"
                    fill="rgba(255, 255, 255, 0.75)"
                    radius={[8, 8, 0, 0]}
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
