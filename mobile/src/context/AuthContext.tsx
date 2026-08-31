import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, authService, SignupData, LoginData } from '@/services/auth.service';
import { ApiError, setUnauthorizedHandler, setAuthTokenCache, clearAuthTokenCache } from '@/services/api';
import { getToken, saveToken, clearAuthStorage, getUser, saveUser, getFcmToken, removeFcmToken } from '@/utils/storage';
import { notificationService } from '@/services/notification.service';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loggingOutRef = useRef(false);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) {
      return;
    }

    loggingOutRef.current = true;
    try {
      const fcmToken = await getFcmToken();
      if (fcmToken) {
        await notificationService.removeDeviceToken(fcmToken);
      } else {
        await removeFcmToken();
      }
      setUser(null);
      setToken(null);
      clearAuthTokenCache();
      await clearAuthStorage();
    } finally {
      loggingOutRef.current = false;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await getToken();
      const storedUser = await getUser();

      if (!storedToken) {
        return;
      }

      setToken(storedToken);
      setAuthTokenCache(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Ignore invalid cached user JSON
        }
      }

      setIsLoading(false);

      try {
        const freshUser = await authService.getMe();
        setUser(freshUser);
        await saveUser(JSON.stringify(freshUser));
      } catch (error) {
        const apiError = error as ApiError;

        if (apiError.status === 401) {
          setUser(null);
          setToken(null);
          clearAuthTokenCache();
          await clearAuthStorage();
        }
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

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data);
    setUser(response.user);
    setToken(response.token);
    setAuthTokenCache(response.token);
    await saveToken(response.token);
    await saveUser(JSON.stringify(response.user));
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const response = await authService.signup(data);
    setUser(response.user);
    setToken(response.token);
    setAuthTokenCache(response.token);
    await saveToken(response.token);
    await saveUser(JSON.stringify(response.user));
  }, []);

  const updateUser = useCallback(async (nextUser: User) => {
    setUser(nextUser);
    await saveUser(JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      signup,
      logout,
      restoreSession,
      updateUser,
    }),
    [user, token, isLoading, login, signup, logout, restoreSession, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
