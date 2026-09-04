import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import { Dumbbell, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({ name, email, password });
      login(res.token, res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-card p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="inline-flex p-3 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Join GymTracker
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Start tracking sets, calculating 1RMs, and crushing plateaus.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Lifter"
                  className="w-full pl-11 pr-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@gymtracker.com"
                  className="w-full pl-11 pr-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-dark-900 bg-gradient-to-r from-brand-cyan to-blue-400 hover:from-cyan-400 hover:to-blue-300 shadow-glow-cyan transition-all transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-cyan hover:text-cyan-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
