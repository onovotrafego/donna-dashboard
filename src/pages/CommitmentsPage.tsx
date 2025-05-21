
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import WeeklyRemindersHighlight from '@/components/reminders/WeeklyRemindersHighlight';
import RemindersCalendar from '@/components/reminders/RemindersCalendar';
import ReminderCard from '@/components/reminders/ReminderCard';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Reminder } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { verifyClientIds } from '@/utils/auth/searchUtils';

const CommitmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log('[COMMITMENTS] Componente montado com pathname:', location.pathname);
    console.log('[COMMITMENTS] Auth context user:', user);
    console.log('[COMMITMENTS] Local storage user ID:', localStorage.getItem('user_id'));
    
    // Verify the client IDs for debugging
    verifyClientIds();
    
    // Force invalidate the query cache for reminders
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    
    // Verify the Supabase auth session
    supabase.auth.getSession().then(({ data }) => {
      console.log('[COMMITMENTS] Supabase session user:', data.session?.user);
    });
    
    // Cleanup function
    return () => {
      console.log('[COMMITMENTS] Componente desmontado');
    };
  }, [user, location.pathname, queryClient]);
  
  // Recuperar o client_id do localStorage, que é o ID correto para consultas
  const clientId = localStorage.getItem('user_id');
  
  // Função de fetch separada para maior clareza
  const fetchReminders = useCallback(async () => {
    if (!clientId) {
      console.error('[COMMITMENTS] Nenhum client_id disponível no localStorage, não foi possível buscar lembretes');
      throw new Error('Client ID não disponível');
    }
    
    console.log('[COMMITMENTS] Iniciando busca de lembretes para client_id:', clientId);
    
    try {
      const result = await debugSupabaseQuery(
        supabase
          .from('donna_lembretes')
          .select('*')
          .eq('client_id', clientId),
        'fetch-user-commitments'
      );
        
      if (result.error) {
        console.error('[COMMITMENTS] Erro ao buscar lembretes:', result.error);
        throw result.error;
      }
      
      console.log('[COMMITMENTS] Lembretes buscados com sucesso:', result.data?.length || 0);
      if (result.data && result.data.length > 0) {
        console.log('[COMMITMENTS] Exemplo de lembrete:', result.data[0]);
      } else {
        console.log('[COMMITMENTS] Nenhum lembrete encontrado para este cliente');
      }
      
      return result.data as Reminder[];
    } catch (e) {
      console.error('[COMMITMENTS] Exceção durante a busca:', e);
      throw e;
    }
  }, [clientId]);
  
  // Buscar os lembretes do usuário usando o client_id
  const { 
    data: reminders = [], 
    isLoading, 
    error,
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['reminders', clientId, location.pathname, Date.now()], // Adicionar timestamp para forçar refetch
    queryFn: fetchReminders,
    enabled: !!clientId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Dados sempre são considerados obsoletos
    retry: 2, // Tentar novamente 2 vezes em caso de falha
  });
  
  // Forçar o refetch quando o componente é montado ou a rota muda
  useEffect(() => {
    const forceRefetch = async () => {
      console.log('[COMMITMENTS] Forçando refetch dos lembretes...');
      try {
        await refetch();
        console.log('[COMMITMENTS] Refetch concluído com sucesso');
      } catch (err) {
        console.error('[COMMITMENTS] Erro durante o refetch:', err);
      }
    };
    
    forceRefetch();
  }, [refetch, location.pathname]);
  
  useEffect(() => {
    console.log('[COMMITMENTS] Estado atual dos lembretes:', { 
      count: reminders.length,
      isLoading,
      isRefetching,
      error: error ? 'Sim' : 'Não'
    });
  }, [reminders, isLoading, isRefetching, error]);
  
  // Filtra os lembretes pela data selecionada
  const selectedDateReminders = selectedDate 
    ? reminders.filter(reminder => {
        const reminderDate = new Date(reminder.lembrete_data);
        const result = isSameDay(reminderDate, selectedDate);
        return result;
      })
    : [];
  
  // Manipula a seleção de data
  const handleSelectDate = (date: Date | undefined) => {
    console.log('[COMMITMENTS] Data selecionada:', date);
    setSelectedDate(date);
  };

  // Função para forçar manualmente o recarregamento dos dados
  const handleRefresh = () => {
    console.log('[COMMITMENTS] Recarregamento manual dos dados');
    toast({
      title: "Atualizando dados",
      description: "Buscando seus compromissos mais recentes..."
    });
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    refetch();
  };

  // Renderiza o conteúdo da página
  const renderContent = () => {
    if (isLoading || isRefetching) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Carregando compromissos...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2 text-destructive">Erro ao carregar compromissos</h3>
          <p className="text-muted-foreground">
            Ocorreu um erro ao buscar seus compromissos. Por favor, tente novamente mais tarde.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-4 flex items-center justify-center mx-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </button>
        </Card>
      );
    }
    
    if (reminders.length === 0) {
      return (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">Nenhum compromisso encontrado</h3>
          <p className="text-muted-foreground">
            Você ainda não possui nenhum compromisso financeiro registrado.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-4 flex items-center justify-center mx-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Verificar novamente
          </button>
        </Card>
      );
    }
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Meus Compromissos</h2>
          <button 
            onClick={handleRefresh}
            className="flex items-center text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/80"
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
          </button>
        </div>
        
        <WeeklyRemindersHighlight 
          reminders={reminders} 
          onSelectDate={handleSelectDate} 
        />
        
        <div className="mb-6">
          <RemindersCalendar 
            reminders={reminders} 
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate} 
          />
        </div>
        
        {selectedDate && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">
                Compromissos: {format(selectedDate, 'PP', { locale: ptBR })}
              </h3>
              <button 
                onClick={() => setSelectedDate(undefined)}
                className="text-xs text-primary"
              >
                Limpar seleção
              </button>
            </div>
            
            {selectedDateReminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum compromisso para esta data
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout title="Meus Compromissos">
      <div className="max-w-md mx-auto">
        {renderContent()}
      </div>
    </MainLayout>
  );
};

export default CommitmentsPage;
