import React, { createContext, useContext, useEffect, useState } from 'react';
// Removing Supabase User/Session imports as we are using custom auth
// import { User, Session } from '@supabase/supabase-js';
// import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: { id: string; email: string; permissions?: string[] } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; permissions?: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for persisted session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Dynamically import to avoid circular dependency issues if any, 
    // though strict 'import' at top is fine. 
    // Using the service we created.
    const { adminLogin } = await import('@/services/adminAuthService');

    const response = await adminLogin(email, password);

    if (response.success && response.user) {
      setUser(response.user);
      localStorage.setItem('admin_user', JSON.stringify(response.user));
      return { error: null };
    } else {
      return { error: new Error(response.message) };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
