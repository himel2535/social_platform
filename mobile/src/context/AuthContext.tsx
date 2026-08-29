import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, authService, SignupData, LoginData } from '@/services/auth.service';
import { getToken, saveToken, clearAuthStorage, getUser, saveUser } from '@/utils/storage';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // Phase 6: validate token via authService.getMe()
      }
    } catch (error) {
      console.warn('[Auth] Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data);
    setUser(response.user);
    setToken(response.token);
    await saveToken(response.token);
    await saveUser(JSON.stringify(response.user));
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const response = await authService.signup(data);
    setUser(response.user);
    setToken(response.token);
    await saveToken(response.token);
    await saveUser(JSON.stringify(response.user));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await clearAuthStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        signup,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
