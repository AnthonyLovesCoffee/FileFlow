import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      // You might want to fetch user details here if needed
      setUser({
        id: response.userId,
        email: email,
        roles: [] // Populate roles if available from backend
      });
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    return await authService.register({ email, password });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
      <AuthContext.Provider value={{
        user,
        login,
        register,
        logout,
        isAuthenticated
      }}>
        {children}
      </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};