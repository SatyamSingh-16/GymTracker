import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogWorkoutPage } from './pages/LogWorkoutPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ProgressPage } from './pages/ProgressPage';
import { FloatingAITrigger } from './components/ai/FloatingAITrigger';
import { AICoachModal } from './components/ai/AICoachModal';

const AppContent: React.FC = () => {
  const { token } = useAuth();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-white selection:text-black">
      {/* Ambient 3D Dark Spheres & Gradient Glows (Inspired by Image 1 & 2) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Right Ambient Sphere & Light Streak */}
        <div className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl opacity-60" />
        <div className="absolute top-1/4 right-[10%] w-[260px] h-[260px] rounded-full bg-gradient-to-br from-zinc-700/20 to-black/40 shadow-2xl border border-white/5 opacity-50 hidden lg:block" />

        {/* Bottom Left Floating Sphere */}
        <div className="absolute -bottom-32 -left-28 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-zinc-800/30 via-zinc-900/20 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-1/3 left-[5%] w-[160px] h-[160px] rounded-full bg-gradient-to-br from-white/5 to-black/60 shadow-2xl border border-white/5 opacity-40 hidden md:block" />

        {/* Center Subtle Diagonal Light Wave */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent rotate-12 blur-3xl" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/log" element={<LogWorkoutPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/analytics" element={<ProgressPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating AI Coach Trigger & Chat Drawer (Visible for logged-in lifters) */}
      {token && (
        <>
          <FloatingAITrigger onClick={() => setAiModalOpen(true)} isOpen={aiModalOpen} />
          <AICoachModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
        </>
      )}

      <footer className="py-8 border-t border-white/[0.08] text-center text-xs text-slate-500 relative z-10 backdrop-blur-md bg-dark-900/40">
        GymTracker &copy; {new Date().getFullYear()} &mdash; Clean. Modern. Effective.
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

