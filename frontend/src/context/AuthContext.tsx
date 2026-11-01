import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  demoUsers: User[];
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  register: (data: { username: string; display_name: string; email: string; avatar_url?: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Fetch demo users for the switcher
  const loadDemoUsers = async () => {
    try {
      const users = await api.getDemoUsers();
      setDemoUsers(users);
      return users;
    } catch {
      return [];
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const me = await api.getMe();
      setCurrentUser(me);
    } catch {
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await loadDemoUsers();
      const token = getAuthToken();
      
      if (token) {
        try {
          const me = await api.getMe();
          setCurrentUser(me);
        } catch {
          // If token expired or invalid, reset cleanly to logged-out
          setAuthToken(null);
          setCurrentUser(null);
        }
      } else {
        // User is logged out by default
        setCurrentUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password?: string) => {
    const data = await api.login(usernameOrEmail, password);
    setAuthToken(data.access_token);
    setCurrentUser(data.user);
  };

  const register = async (data: { username: string; display_name: string; email: string; avatar_url?: string }) => {
    const res = await api.register(data);
    setAuthToken(res.access_token);
    setCurrentUser(res.user);
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  const switchDemoUser = async (username: string) => {
    setLoading(true);
    try {
      const data = await api.switchDemoUser(username);
      setAuthToken(data.access_token);
      setCurrentUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        demoUsers,
        login,
        register,
        logout,
        switchDemoUser,
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
