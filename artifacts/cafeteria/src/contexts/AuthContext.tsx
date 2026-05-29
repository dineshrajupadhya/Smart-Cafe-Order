import { createContext, useContext, useState, ReactNode } from 'react';
import { setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';

interface AuthContextType {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());

  const setToken = (t: string) => {
    setAuthToken(t);
    setTokenState(t);
  };

  const logout = () => {
    removeAuthToken();
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
