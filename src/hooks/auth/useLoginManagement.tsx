import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { loginWithPassword } from '@/utils/auth';
import { setSessionData } from '@/utils/auth/authSession';
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { queryClient } from '@/App'; // Import queryClient
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

/**
 * Hook para gerenciar login
 */
export const useLoginManagement = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const preloadRemindersData = async (clientId: string) => {
    logger.debug('Precarregando dados de lembretes para cliente', {
      clientId: getObfuscatedId(clientId),
      tags: ['auth', 'reminders']
    });
    
    try {
      // Executar a query e obter o resultado
      const query = supabase
        .from('donna_lembretes')
        .select('*')
        .eq('client_id', clientId);
      
      const queryResult = await query;
      
      // Usar o debugSupabaseQuery para registrar a execução
      await debugSupabaseQuery(
        Promise.resolve({
          data: queryResult.data,
          error: queryResult.error
        }),
        'preload-user-reminders'
      );
      
      if (queryResult.error) {
        logger.error('Erro ao pré-carregar lembretes', queryResult.error, {
          clientId: getObfuscatedId(clientId),
          errorCode: queryResult.error.code,
          tags: ['auth', 'reminders', 'error']
        });
        return;
      }
      
      const remindersCount = queryResult.data?.length || 0;
      logger.debug(`Pré-carregados ${remindersCount} lembretes com sucesso`, {
        count: remindersCount,
        clientId: getObfuscatedId(clientId),
        tags: ['auth', 'reminders']
      });
      
      // Armazenar os lembretes no cache do React Query
      queryClient.setQueryData(['reminders', clientId], queryResult.data);
      queryClient.invalidateQueries({ queryKey: ['reminders'] }); // Marcar como inválido para forçar refetch quando necessário
      
      logger.debug('Dados de lembretes armazenados no cache do React Query', {
        clientId: getObfuscatedId(clientId),
        tags: ['auth', 'reminders']
      });
    } catch (error) {
      logger.error('Exceção ao pré-carregar lembretes', error as Error, {
        clientId: getObfuscatedId(clientId),
        tags: ['auth', 'reminders', 'error']
      });
    }
  };

  // Login do usuário
  const loginUser = async (userId: string, password: string, passwordHash: string, userName: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      logger.debug("Tentando login para usuário", {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'login']
      });
      
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
        logger.debug("Falha no login: senha inválida", {
          userId: getObfuscatedId(userId),
          tags: ['auth', 'login', 'failure']
        });
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
      
      logger.debug("Login realizado com sucesso", {
        userId: getObfuscatedId(userId),
        userName: userName.substring(0, 1) + '***',
        tags: ['auth', 'login', 'success']
      });
      
      // Notificar usuário
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userName}!`
      });
      
      // Redirecionar para página principal
      navigate('/');
      
      return true;
    } catch (error) {
      logger.error("Erro durante o login", error as Error, {
        userId: getObfuscatedId(userId),
        tags: ['auth', 'login', 'error']
      });
      
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
