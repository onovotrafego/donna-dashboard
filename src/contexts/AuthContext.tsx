
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getAuthToken, clearAuthToken } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  logout: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load user from local storage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = getAuthToken();
        
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('user_name');
        
        if (userId && userName) {
          console.log('[AUTH] Restored user session:', userId, userName);
          setUser({ id: userId, name: userName });
          setIsAuthenticated(true);
        } else {
          console.log('[AUTH] Invalid user data in session');
          clearAuthToken(); // Clean up invalid session
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AUTH] Error loading user session:', error);
        clearAuthToken(); // Clean up on error
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
    
    // Set up a storage event listener for multi-tab synchronization
    const handleStorageChange = (event) => {
      if (event.key === 'auth_token' || event.key === 'user_id' || event.key === null) {
        console.log('[AUTH] Storage change detected, updating auth state');
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    try {
      clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      
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
    <AuthContext.Provider value={{ user, loading, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected route component
export const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "Acesso não autorizado",
        description: "Por favor, faça login para acessar esta página.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1A365D]">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
