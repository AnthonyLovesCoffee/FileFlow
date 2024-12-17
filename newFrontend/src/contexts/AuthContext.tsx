import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types/auth';
import { login, register } from '../services/api';

interface AuthContextType {
  user: string | null;
  token: string | null;
  loginUser: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const loginUser = async (username: string, password: string) => {
    const response = await login(username, password);
    setToken(response.token);
    setUser(username);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', username);
  };

  const registerUser = async (username: string, password: string) => {
    await register(username, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
      <AuthContext.Provider value={{ user, token, loginUser, registerUser, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};