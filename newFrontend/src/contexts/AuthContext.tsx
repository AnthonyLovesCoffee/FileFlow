import React, { createContext, useContext, useState } from 'react';
import { AuthContextType, User } from '../types/auth';
import { toast } from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      const mockUser = {
        id: '1',
        email,
        name: 'Daniel',
      };
      setUser(mockUser);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // TODO: Replace with actual API call
      const mockUser = {
        id: '1',
        email,
        name,
      };
      setUser(mockUser);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error('Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}