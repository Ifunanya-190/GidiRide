import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/user';
import { clearSession, getStoredToken, getStoredUser, persistSession, updateSessionUser } from './session';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoFallback: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [isDemoFallback, setDemoFallback] = useState(
    () => localStorage.getItem('gidiride.demoFallbackUsed') === 'true'
  );

  const persistAuth = useCallback((response: AuthResponse) => {
    persistSession(response.token, response.user);
    setToken(response.token);
    setUserState(response.user);
    setDemoFallback(localStorage.getItem('gidiride.demoFallbackUsed') === 'true');
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      persistAuth(response);
      return response;
    },
    [persistAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      persistAuth(response);
      return response;
    },
    [persistAuth]
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((nextUser: User) => {
    updateSessionUser(nextUser);
    setUserState(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isDemoFallback,
      login,
      register,
      logout,
      setUser
    }),
    [isDemoFallback, login, logout, register, setUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
