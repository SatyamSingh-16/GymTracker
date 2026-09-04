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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'back':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'legs':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'shoulders':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'arms':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 mb-3">
            <Library className="w-3.5 h-3.5" /> Exercise Library
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Exercise Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse standard movements, filter by muscle groups, and view performance graphs.
          </p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise by name..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan text-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-brand-cyan text-dark-900 shadow-glow-cyan'
                : 'bg-dark-800 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading exercises catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-2 border border-slate-800">
          <Dumbbell className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No exercises matched</h3>
          <p className="text-slate-400 text-xs">Try adjusting your search query or filter category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${getCategoryBadgeClass(
                      ex.category
                    )}`}
                  >
                    {ex.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID #{ex.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">
                  {ex.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Equipment: <span className="text-slate-300 font-medium">{ex.equipment}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <Link
                  to={`/analytics?exerciseId=${ex.id}`}
                  className="flex items-center gap-1 text-brand-cyan hover:underline font-medium"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>View Analytics</span>
                </Link>
                <Link
                  to="/log"
                  className="flex items-center gap-1 text-brand-emerald hover:underline font-medium"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
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
