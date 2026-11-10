'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserSubscription } from '../types/stamp';
import { ApiService } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, company?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  /** mobile number + username + password */
  registerAccount: (mobile: string, username: string, password: string, countryCode?: string) => Promise<void>;
  /** mobile number or username + password */
  loginAccount: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const savedToken = localStorage.getItem('stamiox_auth_token');
      if (savedToken) {
        setToken(savedToken);
        const res = await ApiService.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setSubscription(res.subscription);
          try { localStorage.setItem('stamiox_has_account', '1'); } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.warn('Auth auto-login failed:', err);
      ApiService.removeToken();
      setToken(null);
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await ApiService.login({ email, password });
      if (res.success && res.token) {
        ApiService.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setSubscription(res.subscription);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, company?: string) => {
    setIsLoading(true);
    try {
      const res = await ApiService.register({ email, password, name, company });
      if (res.success && res.token) {
        ApiService.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setSubscription(res.subscription);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applySession = (res: { success: boolean; token: string; user: any; subscription: any }) => {
    if (res.success && res.token) {
      ApiService.setToken(res.token);
      try { localStorage.setItem('stamiox_has_account', '1'); } catch { /* ignore */ }
      setToken(res.token);
      setUser(res.user);
      setSubscription(res.subscription);
    }
  };
  const registerAccount = async (mobile: string, username: string, password: string, countryCode = '+91') => {
    applySession(await ApiService.registerAccount({ mobile, username, password, countryCode }));
  };
  const loginAccount = async (identifier: string, password: string) => {
    applySession(await ApiService.loginAccount({ identifier, password }));
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.demoLogin();
      if (res.success && res.token) {
        ApiService.setToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setSubscription(res.subscription);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ApiService.removeToken();
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    try {
      const res = await ApiService.getMe();
      if (res.success) {
        setUser(res.user);
        setSubscription(res.subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        registerAccount,
        loginAccount,
        logout,
        refreshUser,
      }}
    >
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
