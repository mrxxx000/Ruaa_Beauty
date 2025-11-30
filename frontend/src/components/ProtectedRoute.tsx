import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  try {
    const userObj = JSON.parse(user);
    if (requiredRole && userObj.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
