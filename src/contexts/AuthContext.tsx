
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
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession) {
          const userId = currentSession.user.id;
          const userName = sessionStorage.getItem('user_name') || 'Usuário';
          
          setUser({ id: userId, name: userName });
          console.log('[AUTH] Session updated from auth state change', userId);
        } else {
          setUser(null);
          console.log('[AUTH] No session in auth state change');
        }
      }
    );

    // Check for session from storage
    const userId = sessionStorage.getItem('user_id');
    const userName = sessionStorage.getItem('user_name');
    
    if (userId && userName) {
      console.log('[AUTH] Found user in session storage:', userId);
      setUser({ id: userId, name: userName });
      
      // Debug - check if there's any session data in Supabase
      supabase.auth.getSession().then(({ data }) => {
        console.log('[AUTH] Current Supabase session:', data.session);
        setSession(data.session);
      });
    } else {
      console.log('[AUTH] No user found in session storage');
    }
    
    setLoading(false);
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('user_id');
      sessionStorage.removeItem('user_name');
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
