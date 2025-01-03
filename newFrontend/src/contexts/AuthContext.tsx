import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { login, register } from '../services/api';
import { Loader } from 'lucide-react';

interface AuthContextType {
  user: string | null;
  token: string | null;
  loginUser: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('user_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

   const loginUser = async (username: string, password: string) => {
      try {
        const response = await login(username, password);
        if (response && response.token) {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;

          // Update state sequentially
          setToken(response.token);
          setUser(username);
          setIsAuthenticated(true);

          // Store in localStorage
          localStorage.setItem('user_token', response.token);
          localStorage.setItem('user', username);

          return response;
        }
        throw new Error('Login failed: No token received');
      } catch (error) {
        console.error('Login error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('user_token');
        localStorage.removeItem('user');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loginUser,
      registerUser,
      logout,
      isAuthenticated,
      isLoading
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