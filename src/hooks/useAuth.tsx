import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState } from '@/types';
import * as authService from '@/services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => authService.getAuthState());

  const login = useCallback((email: string, password: string) => {
    const result = authService.login(email, password);
    if (result.success && result.user) {
      setAuthState({ user: result.user, isAuthenticated: true });
    }
    return result;
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const result = authService.signup(name, email, password);
    if (result.success && result.user) {
      setAuthState({ user: result.user, isAuthenticated: true });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
