import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workoutsApi } from '../api/endpoints';
import type { WorkoutLog } from '../types';
import { StatCard } from '../components/common/StatCard';
import {
  PlusCircle,
  Flame,
  Dumbbell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowRight,
  FolderOpen,
  Folder,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Calendar Modal State
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Today string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Currently selected date
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // The end date of the 7-day strip window (defaults to today)
  const [windowEndDate, setWindowEndDate] = useState<Date>(() => new Date());

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

  // Close calendar popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this workout log?')) return;

    setDeletingId(id);
    try {
      await workoutsApi.delete(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert('Failed to delete workout. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Group workouts by date: map 'YYYY-MM-DD' => WorkoutLog[]
  const workoutsByDate = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {};
    for (const w of workouts) {
      if (!map[w.workout_date]) {
        map[w.workout_date] = [];
      }
      map[w.workout_date].push(w);
    }
    return map;
  }, [workouts]);

  // Total unique days client attended gym
  const uniqueGymDays = Object.keys(workoutsByDate).length;

  // Total calories burned estimate (~8.5 kcal per working set + 0.08 kcal per kg of volume moved)
  const totalCaloriesBurned = useMemo(() => {
    return Math.round(
      workouts.reduce((total, w) => {
        const wVol = (w.sets || []).reduce((sum, s) => sum + s.reps * s.weight_kg, 0);
        const wSets = w.sets?.length || 0;
        return total + (wSets * 8.5 + wVol * 0.08);
      }, 0)
    );
  }, [workouts]);

  const totalSets = useMemo(() => {
    return workouts.reduce((total, w) => total + (w.sets?.length || 0), 0);
  }, [workouts]);

  // 7-Day sliding window calculation
  const sevenDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(windowEndDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const dayWorkouts = workoutsByDate[dateStr] || [];
      const hasWorkouts = dayWorkouts.length > 0;

      let focusLabel = 'Rest Day';
      if (hasWorkouts) {
        const notesWithText = dayWorkouts.find((w) => w.notes?.trim());
        if (notesWithText && notesWithText.notes.trim()) {
          focusLabel = notesWithText.notes.trim();
        } else {
          const firstEx = dayWorkouts[0]?.sets?.[0]?.exercise_name;
          focusLabel = firstEx ? `${firstEx}` : 'Workout Logged';
        }
      }

      days.push({
        dateStr,
        dayName,
        dayNum,
        hasWorkouts,
        workouts: dayWorkouts,
        focusLabel,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [windowEndDate, workoutsByDate, todayStr]);

  const shiftWindow = (daysCount: number) => {
    setWindowEndDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + daysCount);
      return next;
    });
  };

  const jumpToToday = () => {
    setWindowEndDate(new Date());
    setSelectedDate(todayStr);
  };

  // Calendar Grid calculation for Custom Modal
  const calendarGrid = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const hasWorkout = Boolean(workoutsByDate[dateStr]?.length);
      cells.push({
        day,
        dateStr,
        hasWorkout,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [calendarViewDate, workoutsByDate, selectedDate, todayStr]);

  const changeCalendarMonth = (diff: number) => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));
  };

  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    setWindowEndDate(new Date(dateStr + 'T00:00:00'));
    setCalendarOpen(false);
  };

  // Selected day details
  const selectedDayWorkouts = workoutsByDate[selectedDate] || [];
  const selectedDayCalories = Math.round(
    selectedDayWorkouts.reduce((sum, w) => {
      const vol = (w.sets || []).reduce((sSum, s) => sSum + s.reps * s.weight_kg, 0);
      return sum + (w.sets?.length || 0) * 8.5 + vol * 0.08;
    }, 0)
  );
  const selectedDayVolume = selectedDayWorkouts.reduce((sum, w) => {
    return sum + (w.sets || []).reduce((sSum, s) => sSum + s.reps * s.weight_kg, 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Athlete Command Center
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
          title="Workout Sessions"
          value={loading ? '...' : `${uniqueGymDays} Days`}
          subtitle="Unique days you trained at the gym"
          icon={Dumbbell}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          glowClass="hover:border-brand-emerald/40"
        />
        <StatCard
          title="Calories Burned"
          value={loading ? '...' : `${totalCaloriesBurned.toLocaleString()} kcal`}
          subtitle="Estimated resistance energy output"
          icon={Flame}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowClass="hover:border-amber-500/40"
        />
        <StatCard
          title="Total Sets Recorded"
          value={loading ? '...' : totalSets}
          subtitle="Working sets completed to date"
          icon={Zap}
          gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          glowClass="hover:border-purple-500/40"
        />
      </div>

      {/* 7-Day Folder Strip & Custom Calendar Popover */}
      <div className="space-y-4 relative">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Weekly Workout Folders
              </h2>
              <p className="text-xs text-slate-400">
                Click any day below to open its training folder and inspect exercises
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => shiftWindow(-7)}
              className="p-2 rounded-xl bg-dark-800 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={jumpToToday}
              className="px-3 py-1.5 rounded-xl bg-dark-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              Today
            </button>

            <button
              onClick={() => shiftWindow(7)}
              className="p-2 rounded-xl bg-dark-800 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Jump to Date Button with Custom Interactive Calendar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-glow-cyan ${
                  calendarOpen
                    ? 'bg-brand-cyan text-dark-900 border-brand-cyan font-bold'
                    : 'bg-dark-800 border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/10'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Jump to Date</span>
              </button>

              {/* Custom Calendar Popover with Gym Attendance Fire Icons 🔥 */}
              {calendarOpen && (
                <div
                  ref={calendarRef}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl bg-dark-800/95 backdrop-blur-xl border border-slate-700 shadow-2xl z-50 space-y-3"
                >
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                    <button
                      onClick={() => changeCalendarMonth(-1)}
                      className="p-1 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-white tracking-wide">
                      {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => changeCalendarMonth(1)}
                      className="p-1 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 uppercase">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Calendar Dates Grid with Gym Attendance Fire Icons 🔥 */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((cell, idx) => {
                      if (!cell) {
                        return <div key={idx} className="h-8" />;
                      }

                      return (
                        <button
                          key={cell.dateStr}
                          onClick={() => handleSelectDateFromCalendar(cell.dateStr)}
                          className={`h-8 rounded-lg text-xs font-medium relative flex flex-col items-center justify-center transition-all ${
                            cell.isSelected
                              ? 'bg-brand-emerald text-dark-900 font-extrabold shadow-glow-emerald'
                              : cell.isToday
                              ? 'border border-brand-emerald text-brand-emerald bg-dark-700'
                              : 'hover:bg-dark-700 text-slate-200'
                          }`}
                        >
                          <span>{cell.day}</span>
                          {/* Fire Icon on Attended Gym Days 🔥 */}
                          {cell.hasWorkout && (
                            <span
                              className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center text-[10px]"
                              title="Workout completed on this day"
                            >
                              🔥
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer legend */}
                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>🔥</span>
                      <span className="text-slate-300">= Gym Day</span>
                    </div>
                    <button
                      onClick={() => setCalendarOpen(false)}
                      className="text-brand-cyan hover:underline font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The 7-Day Folder Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {sevenDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`relative text-left p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between min-h-[110px] border ${
                  isSelected
                    ? 'bg-dark-800 border-brand-emerald shadow-glow-emerald ring-1 ring-brand-emerald transform -translate-y-1'
                    : day.hasWorkouts
                    ? 'glass-card border-slate-800 hover:border-slate-700 hover:bg-dark-800/80'
                    : 'bg-dark-900/40 border-slate-800/50 hover:border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {day.dayName}
                  </span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-emerald/20 text-brand-emerald">
                      TODAY
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <span
                    className={`text-base font-extrabold ${
                      isSelected ? 'text-brand-emerald' : 'text-white'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </div>

                <div className="w-full">
                  {day.hasWorkouts ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-cyan truncate">
                      <span className="text-xs shrink-0">🔥</span>
                      <span className="truncate" title={day.focusLabel}>
                        {day.focusLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Moon className="w-3 h-3 shrink-0" />
                      <span>Rest Day</span>
                    </div>
                  )}
                </div>

                <div
                  className={`absolute bottom-0 left-4 right-4 h-1 rounded-t-full transition-all ${
                    isSelected
                      ? 'bg-brand-emerald'
                      : day.hasWorkouts
                      ? 'bg-brand-cyan/40'
                      : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Day Detailed Folder */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  {selectedDate === todayStr && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/20 text-brand-emerald">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDayWorkouts.length > 0
                    ? `${selectedDayWorkouts.length} workout session(s) logged on this date`
                    : 'No workout logged for this date'}
                </p>
              </div>
            </div>

            {selectedDayWorkouts.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-dark-800 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 font-medium uppercase block">
                    Daily Calories
                  </span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    ~{selectedDayCalories} kcal
                  </span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-dark-800 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 font-medium uppercase block">
                    Daily Volume
                  </span>
                  <span className="text-sm font-bold text-brand-cyan font-mono">
                    {Math.round(selectedDayVolume).toLocaleString()} kg
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Exercise Cards */}
          {selectedDayWorkouts.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Moon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Rest & Recovery Day</h4>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  No workout logs recorded for this day. Rest is where the muscles grow!
                </p>
              </div>
              <Link
                to={`/log?date=${selectedDate}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-dark-900 bg-brand-emerald hover:bg-emerald-400 transition-colors shadow-glow-emerald"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Workout For This Day</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {selectedDayWorkouts.map((w, index) => {
                const sessionCalories = Math.round(
                  (w.sets || []).reduce((sum, s) => sum + s.reps * s.weight_kg, 0) * 0.08 +
                    (w.sets?.length || 0) * 8.5
                );
                const sessionVolume = (w.sets || []).reduce(
                  (sum, s) => sum + s.reps * s.weight_kg,
                  0
                );

                return (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl bg-dark-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Replaced Session # with Exercise */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                            Exercise #{index + 1}
                          </span>
                          {w.notes ? (
                            <h4 className="text-lg font-bold text-white mt-1.5">"{w.notes}"</h4>
                          ) : (
                            <h4 className="text-base font-bold text-slate-200 mt-1.5">
                              {w.sets?.[0]?.exercise_name || 'Workout Session'}
                            </h4>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(w.id)}
                          disabled={deletingId === w.id}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete workout log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sets Breakdown */}
                      <div className="space-y-1.5 pt-1">
                        {(w.sets || []).map((s, sIdx) => {
                          const est1RM =
                            s.reps > 0 && s.weight_kg > 0
                              ? (s.weight_kg * (1 + s.reps / 30)).toFixed(1)
                              : '-';

                          return (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-dark-800/70 border border-slate-800/80"
                            >
                              <span className="font-semibold text-slate-200 truncate max-w-[160px]">
                                {s.exercise_name || `Exercise #${s.exercise_id}`}
                              </span>
                              <div className="flex items-center gap-3 text-slate-400 font-mono">
                                <span>
                                  Set {s.set_number}: {s.reps} reps @{' '}
                                  <strong className="text-brand-cyan">{s.weight_kg} kg</strong>
                                </span>
                                <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2">
                                  1RM: <strong className="text-brand-emerald">{est1RM}kg</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>
                          Volume: <strong className="text-white font-mono">{Math.round(sessionVolume).toLocaleString()} kg</strong>
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-mono font-medium">
                          ~{sessionCalories} kcal
                        </span>
                      </div>

                      <Link
                        to={`/analytics?exerciseId=${w.sets?.[0]?.exercise_id || 1}`}
                        className="text-brand-emerald hover:underline flex items-center gap-1 font-semibold"
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
    </div>
  );
};
