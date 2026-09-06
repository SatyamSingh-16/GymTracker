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
    <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 space-y-10">
      {/* Header Banner (Expanded scale & frosted glass like Image 1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 sm:p-12 rounded-[32px] border border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-slate-300 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Clean. Modern. Effective.</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">{user?.name}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Track daily workout folders, burn calories, and break your personal records.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            to="/log"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm sm:text-base text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white transform hover:-translate-y-0.5 btn-white"
          >
            <PlusCircle className="w-5 h-5 text-black !text-black" />
            <span className="text-black !text-black font-bold">Log Today's Workout</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid (More spacious scale) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        <StatCard
          title="Workout Sessions"
          value={loading ? '...' : `${uniqueGymDays} Days`}
          subtitle="Unique days you trained at the gym"
          icon={Dumbbell}
          gradient="from-emerald-500/20 to-teal-500/10"
        />
        <StatCard
          title="Calories Burned"
          value={loading ? '...' : `${totalCaloriesBurned.toLocaleString()} kcal`}
          subtitle="Estimated resistance energy output"
          icon={Flame}
          gradient="from-amber-500/20 to-orange-500/10"
        />
        <StatCard
          title="Total Sets Recorded"
          value={loading ? '...' : totalSets}
          subtitle="Working sets completed to date"
          icon={Zap}
          gradient="from-purple-500/20 to-indigo-500/10"
        />
      </div>

      {/* 7-Day Folder Strip & Custom Calendar Popover */}
      <div className="space-y-5 relative">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white shadow-lg backdrop-blur-md">
              <Folder className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Weekly Workout Folders
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Click any day below to open its training folder and inspect exercises
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative">
            <button
              onClick={() => shiftWindow(-7)}
              className="p-2.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={jumpToToday}
              className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              Today
            </button>

            <button
              onClick={() => shiftWindow(7)}
              className="p-2.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Next 7 Days"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Jump to Date Button with Custom Interactive Calendar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                  calendarOpen
                    ? 'bg-white text-black !text-black border-white shadow-pill-white btn-white'
                    : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/10'
                }`}
              >
                <CalendarIcon className={`w-4 h-4 ${calendarOpen ? 'text-black !text-black' : 'text-slate-300'}`} />
                <span className={calendarOpen ? 'text-black !text-black font-bold' : ''}>Jump to Date</span>
              </button>

              {/* Custom Frosted Calendar Popover with Gym Attendance Fire Icons 🔥 */}
              {calendarOpen && (
                <div
                  ref={calendarRef}
                  className="absolute right-0 top-full mt-3 w-80 sm:w-96 p-6 rounded-[28px] bg-[#0d0e14]/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 space-y-4"
                >
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <button
                      onClick={() => changeCalendarMonth(-1)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                      {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => changeCalendarMonth(1)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Calendar Dates Grid with Gym Attendance Fire Icons 🔥 */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarGrid.map((cell, idx) => {
                      if (!cell) {
                        return <div key={idx} className="h-10 sm:h-11" />;
                      }

                      return (
                        <button
                          key={cell.dateStr}
                          onClick={() => handleSelectDateFromCalendar(cell.dateStr)}
                          className={`h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-medium relative flex flex-col items-center justify-center transition-all ${
                            cell.isSelected
                              ? 'bg-white text-black !text-black font-black shadow-pill-white scale-105 btn-white'
                              : cell.isToday
                              ? 'border border-white/40 text-white bg-white/10 font-bold hover:bg-white/15'
                              : 'hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <span>{cell.day}</span>
                          {/* Fire Icon on Attended Gym Days 🔥 */}
                          {cell.hasWorkout && (
                            <span
                              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center text-xs"
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
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>🔥</span>
                      <span className="text-slate-300 font-medium">= Gym Day</span>
                    </div>
                    <button
                      onClick={() => setCalendarOpen(false)}
                      className="text-white hover:underline font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The 7-Day Folder Strip (Spacious Pill Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {sevenDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`relative text-left p-4 sm:p-5 rounded-[22px] transition-all duration-200 flex flex-col justify-between min-h-[125px] border cursor-pointer group select-none ${
                  isSelected
                    ? 'glass-card border-white/50 bg-white/[0.14] shadow-glass-hover transform -translate-y-1.5 hover:border-white/80 hover:bg-white/[0.22] hover:shadow-2xl ring-1 ring-white/30'
                    : day.hasWorkouts
                    ? 'glass-card border-white/15 bg-white/[0.04] hover:border-white/40 hover:bg-white/[0.09] hover:-translate-y-1 hover:shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/25 hover:bg-white/[0.07] opacity-75 hover:opacity-100 hover:-translate-y-1 hover:shadow-md'
                } ${day.isToday ? 'ring-1 ring-white/25' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {day.dayName}
                  </span>
                  {day.isToday && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                      isSelected
                        ? 'bg-white text-black !text-black border-white shadow-sm'
                        : 'bg-white/20 text-white border-white/30 group-hover:bg-white/30 group-hover:border-white/50'
                    }`}>
                      TODAY
                    </span>
                  )}
                </div>

                <div className="my-1.5">
                  <span
                    className={`text-lg sm:text-xl font-black transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </div>

                <div className="w-full">
                  {day.hasWorkouts ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate">
                      <span className="text-sm shrink-0">🔥</span>
                      <span className="truncate" title={day.focusLabel}>
                        {day.focusLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                      <Moon className="w-3.5 h-3.5 shrink-0" />
                      <span>Rest Day</span>
                    </div>
                  )}
                </div>

                <div
                  className={`absolute bottom-0 left-4 right-4 h-1 rounded-t-full transition-all ${
                    isSelected ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : day.hasWorkouts ? 'bg-white/30 group-hover:bg-white/50' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Day Detailed Folder (Expanded scale & frosted card) */}
        <div className="glass-card rounded-[32px] p-8 sm:p-12 border border-white/10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/15 text-white shadow-xl">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  {selectedDate === todayStr && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedDayWorkouts.length > 0
                    ? `${selectedDayWorkouts.length} workout session(s) logged on this date`
                    : 'No workout logged for this date'}
                </p>
              </div>
            </div>

            {selectedDayWorkouts.length > 0 && (
              <div className="flex items-center gap-3.5">
                <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-right">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                    Daily Calories
                  </span>
                  <span className="text-base font-bold text-amber-300 font-mono">
                    ~{selectedDayCalories} kcal
                  </span>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-right">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">
                    Daily Volume
                  </span>
                  <span className="text-base font-bold text-white font-mono">
                    {Math.round(selectedDayVolume).toLocaleString()} kg
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Exercise Cards */}
          {selectedDayWorkouts.length === 0 ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-400 shadow-lg">
                <Moon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Rest & Recovery Day</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  No workout logs recorded for this day. Rest is where the muscles grow!
                </p>
              </div>
              <Link
                to={`/log?date=${selectedDate}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white btn-white"
              >
                <PlusCircle className="w-4 h-4 text-black !text-black" />
                <span className="text-black !text-black font-bold">Log Workout For This Day</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="p-6 sm:p-7 rounded-[24px] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 uppercase tracking-wider">
                            Exercise #{index + 1}
                          </span>
                          {w.notes ? (
                            <h4 className="text-xl font-bold text-white mt-2">"{w.notes}"</h4>
                          ) : (
                            <h4 className="text-lg font-bold text-slate-200 mt-2">
                              {w.sets?.[0]?.exercise_name || 'Workout Session'}
                            </h4>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(w.id)}
                          disabled={deletingId === w.id}
                          className="p-2.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                          title="Delete workout log"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Sets Breakdown */}
                      <div className="space-y-2 pt-1">
                        {(w.sets || []).map((s, sIdx) => {
                          const est1RM =
                            s.reps > 0 && s.weight_kg > 0
                              ? (s.weight_kg * (1 + s.reps / 30)).toFixed(1)
                              : '-';

                          return (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between text-sm py-2.5 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]"
                            >
                              <span className="font-semibold text-slate-100 truncate max-w-[180px]">
                                {s.exercise_name || `Exercise #${s.exercise_id}`}
                              </span>
                              <div className="flex items-center gap-4 text-slate-400 font-mono text-xs sm:text-sm">
                                <span>
                                  Set {s.set_number}: {s.reps} reps @{' '}
                                  <strong className="text-white font-bold">{s.weight_kg} kg</strong>
                                </span>
                                <span className="text-xs text-slate-400 border-l border-white/15 pl-3">
                                  1RM: <strong className="text-white">{est1RM}kg</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 text-sm">
                      <div className="flex items-center gap-3 text-slate-400 text-xs sm:text-sm">
                        <span>
                          Volume: <strong className="text-white font-mono">{Math.round(sessionVolume).toLocaleString()} kg</strong>
                        </span>
                        <span>•</span>
                        <span className="text-amber-300 font-mono font-semibold">
                          ~{sessionCalories} kcal
                        </span>
                      </div>

                      <Link
                        to={`/analytics?exerciseId=${w.sets?.[0]?.exercise_id || 1}`}
                        className="text-white hover:text-slate-300 flex items-center gap-1.5 font-semibold text-xs sm:text-sm transition-colors"
                      >
                        <span>Analytics</span>
                        <ArrowRight className="w-4 h-4" />
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
