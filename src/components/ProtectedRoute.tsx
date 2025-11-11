import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './auth/LoginForm';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Define admin-only routes
const ADMIN_ONLY_ROUTES = ['/analytics', '/admin'];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <img 
              src="/logo.png" 
              alt="PG Remont Logo" 
              className="h-16 md:h-20 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">PG Remont</h1>
            <p className="text-muted-foreground mb-6">
              Tizimga kirish uchun login va parolingizni kiriting
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  // Check if the current route is admin-only
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  // If it's an admin route and user is not admin, redirect to home
  if (isAdminRoute && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
