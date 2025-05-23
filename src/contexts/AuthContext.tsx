
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AUTH_STATE_CHANGE_EVENT, clearSessionData } from '@/utils/auth';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

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

  // Load user from local storage and set up listeners
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for logged in user in local storage
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('user_name');
        
        logger.debug('Checking local storage for user', {
          userId: getObfuscatedId(userId),
          hasUserName: !!userName,
          tags: ['auth', 'session']
        });
        
        if (userId && userName) {
          logger.debug('Restored user session', {
            userId: getObfuscatedId(userId),
            userName: userName.substring(0, 1) + '***',
            tags: ['auth', 'session']
          });
          setUser({ id: userId, name: userName });
          setIsAuthenticated(true);
        } else {
          logger.debug('No active session found', {
            tags: ['auth', 'session']
          });
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error('Error loading user session', error as Error, {
          tags: ['auth', 'session', 'error']
        });
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial load of user data
    loadUser();
    
    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('Supabase auth state changed', {
          event,
          userId: getObfuscatedId(session?.user?.id),
          tags: ['auth', 'supabase']
        });
        
        // We don't want to update our local state directly from here
        // as our app uses a custom auth mechanism alongside Supabase
        // Just log the event for debugging
      }
    );
    
    // Listen for storage events (for multi-tab support)
    const handleStorageChange = (event) => {
      if (event.key === 'user_id' || event.key === 'user_name' || event.key === null) {
        logger.debug('Storage change detected, updating auth state', {
          key: event.key,
          tags: ['auth', 'storage']
        });
        loadUser();
      }
    };
    
    // Listen for our custom auth state change event
    const handleAuthStateChange = () => {
      logger.debug('Auth state change event detected', {
        tags: ['auth', 'event']
      });
      loadUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, []);

  const logout = async () => {
    try {
      await clearSessionData(); // This also dispatches the auth state change event
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Desconectado",
        description: "Você foi desconectado com sucesso."
      });
      
      navigate('/auth');
    } catch (error) {
      logger.error('Error during logout', error as Error, {
        tags: ['auth', 'logout', 'error']
      });
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
