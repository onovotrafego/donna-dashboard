
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, debugSupabaseQuery, getAuthUser } from '@/integrations/supabase/client';
import { setSessionData } from '@/utils/auth/authSession';
import { logger } from '@/utils/security/secureLogger';
import type { Reminder } from '@/types/reminder';

const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

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
          logger.debug('ID do usuário Supabase encontrado', {
          userId: getObfuscatedId(user.id),
          tags: ['reminders', 'auth']
        });
        setSupabaseUserId(user.id);
        
        // Verificar se há um client_id nos metadados do usuário
        const userMeta = user.user_metadata || {};
        if (userMeta.client_id) {
          logger.debug('client_id encontrado nos metadados do usuário', {
            clientId: getObfuscatedId(userMeta.client_id),
            tags: ['reminders', 'auth']
          });
          
          // Verificar se o client_id dos metadados corresponde ao do localStorage
          if (clientId && clientId !== userMeta.client_id) {
            logger.warn('client_id do localStorage difere do client_id nos metadados', {
              localStorageClientId: getObfuscatedId(clientId),
              metadataClientId: getObfuscatedId(userMeta.client_id),
              tags: ['reminders', 'auth', 'warning']
            });
          }
        } else {
          logger.warn('Nenhum client_id encontrado nos metadados do usuário', {
            userId: getObfuscatedId(user.id),
            tags: ['reminders', 'auth', 'warning']
          });
        }
        }
      } catch (error) {
        logger.error('Erro ao buscar usuário Supabase', error as Error, {
          tags: ['reminders', 'auth', 'error']
        });
      }
    };
    
    fetchSupabaseUser();
  }, [clientId]);
  
  // Função de fetch separada para maior clareza
  const fetchReminders = useCallback(async () => {
    if (!clientId) {
      const errorMessage = 'Nenhum client_id disponível no localStorage, não foi possível buscar lembretes';
      logger.error(errorMessage, new Error(errorMessage), {
        tags: ['reminders', 'fetch', 'error']
      });
      throw new Error('Client ID não disponível');
    }
    
    const obfuscatedClientId = getObfuscatedId(clientId);
    logger.debug('Iniciando busca de lembretes', {
      clientId: obfuscatedClientId,
      timestamp: new Date().toISOString(),
      tags: ['reminders', 'fetch']
    });
    
    try {
      // Verificar se o usuário está autenticado no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('Usuário não autenticado no Supabase, tentando autenticar...', {
          clientId: obfuscatedClientId,
          tags: ['reminders', 'auth', 'warning']
        });
        
        try {
          // Tentar autenticar o usuário
          const userName = localStorage.getItem('user_name') || 'Usuário';
          await setSessionData(clientId, userName);
          
          // Verificar novamente se o usuário está autenticado
          const { data: { user: newUser } } = await supabase.auth.getUser();
          
          if (!newUser) {
            const authError = new Error('Falha ao autenticar usuário no Supabase');
            logger.error('Falha na autenticação do Supabase', authError, {
              clientId: obfuscatedClientId,
              tags: ['reminders', 'auth', 'error']
            });
            throw authError;
          }
          
          logger.debug('Usuário autenticado com sucesso no Supabase', {
            userId: getObfuscatedId(newUser.id),
            tags: ['reminders', 'auth']
          });
        } catch (authError) {
          logger.error('Erro durante a autenticação no Supabase', authError as Error, {
            clientId: obfuscatedClientId,
            tags: ['reminders', 'auth', 'error']
          });
          throw authError;
        }
      } else {
        logger.debug('Usuário já autenticado no Supabase', {
          userId: getObfuscatedId(user.id),
          hasMetadata: !!user.user_metadata,
          tags: ['reminders', 'auth']
        });
      }
      
      // Consulta usando as políticas RLS
      logger.debug('Buscando lembretes com RLS', {
        clientId: obfuscatedClientId,
        table: 'donna_lembretes',
        tags: ['reminders', 'fetch']
      });
      
      const query = supabase
        .from('donna_lembretes')
        .select('*')
        .order('lembrete_data', { ascending: false });
      
      try {
        // Executar a query e obter o resultado
        const queryResult = await query;
        
        // Usar o debugSupabaseQuery para registrar a execução
        await debugSupabaseQuery(
          Promise.resolve({
            data: queryResult.data,
            error: queryResult.error
          }),
          'fetch-user-reminders'
        );
        
        // Usar o resultado da query diretamente
        const result = {
          data: queryResult.data,
          error: queryResult.error
        };
          
        if (result.error) {
          const errorMessage = 'Erro ao buscar lembretes';
          logger.error(errorMessage, result.error, {
            clientId: obfuscatedClientId,
            errorCode: result.error?.code,
            tags: ['reminders', 'fetch', 'error']
          });
          throw result.error;
        }
        
        const remindersData = result.data || [];
        const remindersCount = remindersData.length;
        
        logger.debug('Lembretes buscados com sucesso', {
          count: remindersCount,
          clientId: obfuscatedClientId,
          tags: ['reminders', 'fetch']
        });
        
        if (remindersCount > 0) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Exemplo de lembrete', {
              reminderId: remindersData[0]?.id,
              clientId: obfuscatedClientId,
              tags: ['reminders', 'fetch', 'debug']
            });
          }
          
          return remindersData as Reminder[];
        } else {
          logger.debug('Nenhum lembrete encontrado para este cliente', {
            clientId: obfuscatedClientId,
            tags: ['reminders', 'fetch']
          });
          return [];
        }
      } catch (queryError) {
        const errorMessage = 'Erro na consulta de lembretes';
        logger.error(errorMessage, queryError as Error, {
          clientId: obfuscatedClientId,
          tags: ['reminders', 'fetch', 'error']
        });
        throw queryError;
      }
      
    } catch (e) {
      const errorMessage = 'Exceção durante a busca de lembretes';
      logger.error(errorMessage, e as Error, {
        clientId: obfuscatedClientId,
        tags: ['reminders', 'fetch', 'error']
      });
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
    logger.debug('Recarregamento manual dos dados solicitado', {
      clientId: clientId ? getObfuscatedId(clientId) : 'unknown',
      tags: ['reminders', 'refresh']
    });
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
