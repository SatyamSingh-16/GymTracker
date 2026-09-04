import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gymtracker_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gymtracker_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('gymtracker_token');
      if (storedToken) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('gymtracker_user', JSON.stringify(freshUser));
        } catch {
          // Token invalid/expired
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();

    const handleExternalLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('gymtracker_auth_logout', handleExternalLogout);
    return () => window.removeEventListener('gymtracker_auth_logout', handleExternalLogout);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('gymtracker_token', newToken);
    localStorage.setItem('gymtracker_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gymtracker_token');
    localStorage.removeItem('gymtracker_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
