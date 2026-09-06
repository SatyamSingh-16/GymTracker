import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import { Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="max-w-[460px] w-full glass-card p-8 sm:p-11 rounded-[32px] border border-white/15 shadow-2xl relative overflow-hidden space-y-7 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-white/15 to-transparent blur-xl pointer-events-none rounded-tr-[32px]" />

        <div className="text-center relative space-y-2">
          <div className="inline-flex p-3.5 rounded-full bg-white/[0.07] border border-white/15 text-white shadow-xl mb-1">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/80" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm">
            Join GymTracker and start breaking records.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm backdrop-blur-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3.5">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-12 pr-4 py-3.5 glass-input rounded-2xl text-white placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-3.5 glass-input rounded-2xl text-white placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  className="w-full pl-12 pr-4 py-3.5 glass-input rounded-2xl text-white placeholder-slate-500 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-6 rounded-full text-base font-bold text-black !text-black bg-white hover:bg-slate-200 shadow-pill-white transition-all transform active:scale-[0.98] disabled:opacity-50 btn-white"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2 text-black !text-black font-bold">
                Get Started <ArrowRight className="w-4 h-4 text-black !text-black" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-white hover:underline transition-colors ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
