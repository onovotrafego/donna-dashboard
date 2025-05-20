
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const userId = sessionStorage.getItem('user_id');
    const userName = sessionStorage.getItem('user_name');
    
    if (userId && userName) {
      setUser({ id: userId, name: userName });
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_name');
    setUser(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected route component
export const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1A365D]">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
