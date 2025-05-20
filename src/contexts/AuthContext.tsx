
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  logout: () => void;
  session: Session | null;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  logout: () => {},
  session: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize auth state and set up listener
  useEffect(() => {
    // For custom session management (since we're not using Supabase auth fully)
    // Check for session from storage
    const checkUserSession = () => {
      const userId = sessionStorage.getItem('user_id');
      const userName = sessionStorage.getItem('user_name');
      
      if (userId && userName) {
        console.log('[AUTH] Found user in session storage:', userId, userName);
        setUser({ id: userId, name: userName });
        setLoading(false);
        return true;
      }
      
      console.log('[AUTH] No user found in session storage');
      setUser(null);
      setLoading(false);
      return false;
    };
    
    checkUserSession();
    
    // Set up a window storage event listener for multi-tab synchronization
    const handleStorageChange = (event) => {
      if (event.key === 'user_id' || event.key === null) {
        console.log('[AUTH] Storage change detected, updating auth state');
        checkUserSession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    try {
      // For our custom auth, just clear session storage
      sessionStorage.removeItem('user_id');
      sessionStorage.removeItem('user_name');
      localStorage.clear();
      
      setUser(null);
      setSession(null);
      
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso."
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('[AUTH] Error during logout:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível efetuar o logout corretamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, session }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected route component
export const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Acesso não autorizado",
        description: "Por favor, faça login para acessar esta página.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1A365D]">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
