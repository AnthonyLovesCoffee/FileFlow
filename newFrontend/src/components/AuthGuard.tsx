import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthGuard: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
