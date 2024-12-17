import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { login, register } from '../services/api';

interface AuthContextType {
  user: string | null;
  token: string | null;
  loginUser: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loginUser = async (username: string, password: string) => {
    try {
      const response = await login(username, password);
      if (response && response.token) {
        setToken(response.token);
        setUser(username);
        setIsAuthenticated(true);

        localStorage.setItem('user_token', response.token);
        localStorage.setItem('user', username);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerUser = async (username: string, password: string) => {
    await register(username, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loginUser,
      registerUser,
      logout,
      isAuthenticated
    }}>
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