
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, debugSupabaseQuery, getAuthUser } from '@/integrations/supabase/client';
import { setSessionData } from '@/utils/auth/authSession';
import type { Reminder } from '@/types/reminder';

/**
 * Hook para gerenciar os lembretes/compromissos do usuário
 */
export const useReminders = () => {
  const queryClient = useQueryClient();
  const [forceRefresh, setForceRefresh] = useState(0);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  
  // Recuperar o client_id do localStorage
  const clientId = localStorage.getItem('user_id');
  
  // Buscar o ID do usuário autenticado no Supabase e seus metadados
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      try {
        const user = await getAuthUser();
        if (user?.id) {
          console.log('[REMINDERS] ID do usuário Supabase:', user.id);
          setSupabaseUserId(user.id);
          
          // Verificar se há um client_id nos metadados do usuário
          const userMeta = user.user_metadata || {};
          if (userMeta.client_id) {
            console.log('[REMINDERS] client_id encontrado nos metadados:', userMeta.client_id);
            
            // Verificar se o client_id dos metadados corresponde ao do localStorage
            if (clientId && clientId !== userMeta.client_id) {
              console.warn('[REMINDERS] client_id do localStorage difere do client_id nos metadados');
            }
          } else {
            console.warn('[REMINDERS] Nenhum client_id encontrado nos metadados do usuário');
          }
        }
      } catch (error) {
        console.error('[REMINDERS] Erro ao buscar usuário Supabase:', error);
      }
    };
    
    fetchSupabaseUser();
  }, [clientId]);
  
  // Função de fetch separada para maior clareza
  const fetchReminders = useCallback(async () => {
    if (!clientId) {
      console.error('[REMINDERS] Nenhum client_id disponível no localStorage, não foi possível buscar lembretes');
      throw new Error('Client ID não disponível');
    }
    
    console.log('[REMINDERS] Iniciando busca de lembretes para client_id:', clientId);
    console.log('[REMINDERS] Timestamp da requisição:', new Date().toISOString());
    
    try {
      // Verificar se o usuário está autenticado no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('[REMINDERS] Usuário não autenticado no Supabase, tentando autenticar...');
        
        // Tentar autenticar o usuário
        const userName = localStorage.getItem('user_name') || 'Usuário';
        await setSessionData(clientId, userName);
        
        // Verificar novamente se o usuário está autenticado
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (!newUser) {
          console.error('[REMINDERS] Falha ao autenticar usuário no Supabase');
          throw new Error('Falha na autenticação do Supabase');
        }
        
        console.log('[REMINDERS] Usuário autenticado com sucesso no Supabase:', newUser.id);
      } else {
        console.log('[REMINDERS] Usuário já autenticado no Supabase:', user.id);
        console.log('[REMINDERS] Metadados do usuário:', user.user_metadata);
      }
      
      // Consulta usando as políticas RLS
      console.log('[REMINDERS] Buscando lembretes com RLS');
      const query = supabase
        .from('donna_lembretes')
        .select('*')
        .order('lembrete_data', { ascending: false });
      
      const result = await debugSupabaseQuery(
        query,
        'fetch-user-reminders'
      );
        
      if (result.error) {
        console.error('[REMINDERS] Erro ao buscar lembretes:', result.error);
        throw result.error;
      }
      
      console.log('[REMINDERS] Lembretes buscados com sucesso:', result.data?.length || 0);
      if (result.data && result.data.length > 0) {
        console.log('[REMINDERS] Exemplo de lembrete:', result.data[0]);
        console.log('[REMINDERS] IDs dos primeiros 3 lembretes:', result.data.slice(0, 3).map(r => r.id).join(', '));
      } else {
        console.log('[REMINDERS] Nenhum lembrete encontrado para este cliente');
      }
      
      return result.data as Reminder[];
    } catch (e) {
      console.error('[REMINDERS] Exceção durante a busca:', e);
      throw e;
    }
  }, [clientId]);
  
  // Buscar os lembretes do usuário usando o client_id
  const { 
    data = [], 
    isLoading, 
    error,
    refetch,
    isRefetching,
    dataUpdatedAt
  } = useQuery({
    queryKey: ['reminders', clientId, supabaseUserId, forceRefresh],
    queryFn: fetchReminders,
    enabled: !!clientId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    retry: 2,
  });

  // Função para forçar manualmente o recarregamento dos dados
  const handleRefresh = useCallback(() => {
    console.log('[REMINDERS] Recarregamento manual dos dados');
    // Usando apenas uma forma de forçar o refetch para evitar múltiplas chamadas
    setForceRefresh(prev => prev + 1); // Isso já vai disparar um novo fetch devido à dependência no queryKey
  }, []);
  
  return {
    reminders: data,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
    handleRefresh
  };
};
