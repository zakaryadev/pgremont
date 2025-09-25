import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <img 
              src="/logo.png" 
              alt="TOGO GROUP Logo" 
              className="h-16 md:h-20 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">TOGO GROUP</h1>
            <p className="text-muted-foreground mb-6">
              Tizimga kirish uchun login va parolingizni kiriting
            </p>
          </div>
          <AuthModal 
            isOpen={true} 
            onClose={() => {}} 
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
