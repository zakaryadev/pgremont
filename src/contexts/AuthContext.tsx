import React, { createContext, useContext, useEffect, useState } from 'react';

// Define our custom user type
interface CustomUser {
  id: string;
  name: string;
  role: 'admin' | 'manager';
}

// Predefined users
const PREDEFINED_USERS = {
  'Togo Group PRO': {
    id: 'togo-pro',
    name: 'Togo Group PRO',
    role: 'admin' as const,
    password: 'togo0800'
  },
  'Manager': {
    id: 'manager',
    name: 'Manager',
    role: 'manager' as const,
    password: 'togo0000'
  }
};

interface AuthContextType {
  user: CustomUser | null;
  session: { user: CustomUser } | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<{ user: CustomUser } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setSession({ user: userData });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    // Disable sign up for custom auth
    return { error: { message: 'Registration is not allowed' } };
  };

  const signIn = async (username: string, password: string) => {
    // Check if username exists in predefined users
    const userData = PREDEFINED_USERS[username as keyof typeof PREDEFINED_USERS];
    
    if (!userData) {
      return { error: { message: 'Invalid username' } };
    }

    if (userData.password !== password) {
      return { error: { message: 'Invalid password' } };
    }

    // Create user object without password
    const { password: _, ...userWithoutPassword } = userData;
    
    // Save to localStorage and state
    localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    setSession({ user: userWithoutPassword });

    return { error: null };
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out...');
      
      // Clear localStorage
      localStorage.removeItem('auth_user');
      
      // Clear user and session state
      setUser(null);
      setSession(null);
      
      console.log('AuthContext: Sign out successful');
    } catch (error) {
      console.error('AuthContext: Sign out failed:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
