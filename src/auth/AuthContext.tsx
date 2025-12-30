import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, loginRequest, logoutRequest } from '../api/endpoints';
import type { User } from '../api/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    const loggedIn = await loginRequest(payload);
    setUser(loggedIn);
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
