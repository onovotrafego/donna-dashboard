
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { loginWithPassword } from '@/utils/auth';
import { setSessionData } from '@/utils/auth/authSession';
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { queryClient } from '@/App'; // Import queryClient

/**
 * Hook para gerenciar login
 */
export const useLoginManagement = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const preloadRemindersData = async (clientId: string) => {
    console.log('[AUTH] Precarregando dados de lembretes para cliente:', clientId);
    try {
      const result = await debugSupabaseQuery(
        supabase
          .from('donna_lembretes')
          .select('*')
          .eq('client_id', clientId),
        'preload-user-reminders'
      );
      
      if (result.error) {
        console.error('[AUTH] Erro ao pré-carregar lembretes:', result.error);
        return;
      }
      
      console.log(`[AUTH] Pré-carregados ${result.data.length} lembretes com sucesso`);
      
      // Armazenar os lembretes no cache do React Query
      queryClient.setQueryData(['reminders', clientId], result.data);
      console.log('[AUTH] Dados de lembretes armazenados no cache do React Query');
    } catch (error) {
      console.error('[AUTH] Exceção ao pré-carregar lembretes:', error);
    }
  };

  // Login do usuário
  const loginUser = async (userId: string, password: string, passwordHash: string, userName: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log("[AUTH] Tentando login para usuário:", userId);
      
      if (!password || password.trim() === '') {
        setAuthError("Por favor, digite sua senha");
        toast({
          title: "Campo obrigatório",
          description: "Por favor, digite sua senha",
          variant: "destructive"
        });
        return false;
      }
      
      // Verificar senha
      const isPasswordValid = await loginWithPassword(userId, password, passwordHash);
      
      if (!isPasswordValid) {
        console.log("[AUTH] Falha no login: senha inválida");
        setAuthError("Senha incorreta. Tente novamente.");
        toast({
          title: "Erro de autenticação",
          description: "Senha incorreta. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      // Criar sessão personalizada
      await setSessionData(userId, userName);
      
      // Pré-carregar dados de lembretes após o login bem-sucedido
      await preloadRemindersData(userId);
      
      console.log("[AUTH] Login realizado com sucesso para:", userId);
      
      // Notificar usuário
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userName}!`
      });
      
      // Redirecionar para página principal
      navigate('/');
      
      return true;
    } catch (error) {
      console.error("[AUTH] Erro durante o login:", error);
      
      setAuthError("Ocorreu um erro durante o login. Tente novamente.");
      toast({
        title: "Erro de login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    authError,
    setAuthError,
    loginUser
  };
};
