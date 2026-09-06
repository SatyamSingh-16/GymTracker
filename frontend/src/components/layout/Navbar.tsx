import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, LayoutDashboard, PlusCircle, Library, TrendingUp, LogOut, User as UserIcon, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Log Workout', path: '/log', icon: PlusCircle },
    { name: 'Exercises', path: '/exercises', icon: Library },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0c12]/75 backdrop-blur-2xl border-b border-white/[0.08] transition-all">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Minimalist Sphere & Text */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 via-zinc-800 to-black border border-white/20 shadow-lg flex items-center justify-center group-hover:border-white/40 transition-all">
              <Dumbbell className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Gym<span className="text-slate-400 font-light">Tracker</span>
            </span>
          </Link>

          {/* Desktop Navigation - Pill Bar */}
          {token && (
            <div className="hidden md:flex items-center space-x-1.5 p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Auth Controls */}
          <div className="hidden md:flex items-center space-x-3.5">
            {token && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-sm text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/20 flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium max-w-[130px] truncate text-slate-300">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-black !text-black bg-white hover:bg-slate-200 transition-all shadow-pill-white btn-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0e14]/95 backdrop-blur-2xl border-b border-white/10 px-6 pt-3 pb-5 space-y-2">
          {token &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-medium ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          <div className="pt-3 border-t border-white/10">
            {token && user ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2.5">
                  <UserIcon className="w-5 h-5 text-slate-300" />
                  <span className="text-sm text-slate-200 font-medium">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:underline flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-full bg-white/10 border border-white/15 text-sm font-medium text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-full bg-white text-sm font-bold text-black !text-black btn-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
