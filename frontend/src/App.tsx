import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogWorkoutPage } from './pages/LogWorkoutPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ProgressPage } from './pages/ProgressPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col selection:bg-brand-emerald selection:text-black">
          <Navbar />
          <main className="flex-1">
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
          <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
            GymTracker &copy; {new Date().getFullYear()} &mdash; Engineered for Peak Strength & Performance
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
