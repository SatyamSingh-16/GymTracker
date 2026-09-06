import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { exercisesApi } from '../api/endpoints';
import type { Exercise } from '../types';
import { Library, Search, Dumbbell, TrendingUp, PlusCircle } from 'lucide-react';

export const ExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await exercisesApi.getAll();
        setExercises(data || []);
      } catch (err) {
        console.error('Failed fetching exercises:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const categories = [
    'All',
    ...Array.from(new Set(exercises.map((e) => e.category))).filter(Boolean),
  ];

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'chest':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'back':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'legs':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'shoulders':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'arms':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/20';
      default:
        return 'bg-white/10 text-slate-300 border-white/15';
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 sm:p-10 rounded-[32px] border border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-slate-300 border border-white/15">
            <Library className="w-4 h-4 text-white" />
            <span>Exercise Encyclopedia</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Exercise Catalog
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Browse standard movements, filter by muscle groups, and view performance analytics.
          </p>
        </div>
        <div className="w-full md:w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise by name..."
              className="w-full pl-12 pr-5 py-3.5 glass-input rounded-full text-white placeholder-slate-500 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-white text-black !text-black shadow-pill-white font-bold btn-white'
                : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div className="glass-card p-16 rounded-[28px] text-center space-y-3">
          <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading exercises catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 rounded-[28px] text-center space-y-3 border border-white/10">
          <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No exercises matched</h3>
          <p className="text-slate-400 text-xs sm:text-sm">Try adjusting your search query or filter category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="glass-card glass-card-hover rounded-[26px] p-7 border border-white/10 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getCategoryBadgeClass(
                      ex.category
                    )}`}
                  >
                    {ex.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID #{ex.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-slate-200 transition-colors">
                  {ex.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Equipment: <span className="text-slate-200 font-medium">{ex.equipment}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm">
                <Link
                  to={`/analytics?exerciseId=${ex.id}`}
                  className="flex items-center gap-1.5 text-white hover:text-slate-300 font-semibold"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>View Analytics</span>
                </Link>
                <Link
                  to="/log"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log This</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
