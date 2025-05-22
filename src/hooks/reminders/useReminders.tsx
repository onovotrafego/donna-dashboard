
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, debugSupabaseQuery, getAuthUser } from '@/integrations/supabase/client';
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
  
  // Buscar o ID do usuário autenticado no Supabase
  useEffect(() => {
    const fetchSupabaseUser = async () => {
      try {
        const user = await getAuthUser();
        if (user?.id) {
          console.log('[REMINDERS] ID do usuário Supabase:', user.id);
          setSupabaseUserId(user.id);
        }
      } catch (error) {
        console.error('[REMINDERS] Erro ao buscar usuário Supabase:', error);
      }
    };
    
    fetchSupabaseUser();
  }, []);
  
  // Função de fetch separada para maior clareza
  const fetchReminders = useCallback(async () => {
    if (!clientId) {
      console.error('[REMINDERS] Nenhum client_id disponível no localStorage, não foi possível buscar lembretes');
      throw new Error('Client ID não disponível');
    }
    
    console.log('[REMINDERS] Iniciando busca de lembretes para client_id:', clientId);
    console.log('[REMINDERS] Timestamp da requisição:', new Date().toISOString());
    
    try {
      // Simplificando para usar diretamente o ID fixo que sabemos que funciona
      console.log('[REMINDERS] Buscando lembretes para client_id:', clientId);
      const query = supabase
        .from('donna_lembretes')
        .select('*')
        .eq('client_id', clientId);
      
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
