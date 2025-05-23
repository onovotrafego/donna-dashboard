
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useReminders } from '@/hooks/reminders/useReminders';
import { verifyClientIds } from '@/utils/auth/searchUtils';
import { logger } from '@/utils/security/secureLogger';

// Layout Component
import MainLayout from '@/components/layout/MainLayout';

// Reminder Components
import WeeklyRemindersHighlight from '@/components/reminders/WeeklyRemindersHighlight';
import RemindersCalendar from '@/components/reminders/RemindersCalendar';
import RemindersStatusDisplay from '@/components/reminders/RemindersStatusDisplay';
import RemindersHeader from '@/components/reminders/RemindersHeader';
import SelectedDateReminders from '@/components/reminders/SelectedDateReminders';

const CommitmentsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const location = useLocation();
  
  // Fetch reminders using the custom hook
  const {
    reminders,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
    handleRefresh
  } = useReminders();
  
  // Debug logs on component mount
  useEffect(() => {
    logger.debug('Componente de compromissos montado ou atualizado', {
      tags: ['commitments', 'lifecycle']
    });
    
    // Verify the client IDs for debugging
    verifyClientIds();
    
    // Force refetch when the component is mounted or the route changes
    const forceRefetch = async () => {
      logger.debug('Forçando refetch dos lembretes...', {
        tags: ['commitments', 'data', 'refetch']
      });
      try {
        await refetch();
        logger.debug('Refetch concluído com sucesso', {
          tags: ['commitments', 'data', 'refetch'],
          lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido durante o refetch';
        logger.error(`Erro durante o refetch: ${errorMessage}`);
      }
    };
    
    // Executar o refetch apenas quando o componente é montado ou a rota muda
    forceRefetch();
    
    // Configurar um intervalo para refetch automático a cada 60 segundos (aumentado para reduzir a carga)
    const intervalId = setInterval(() => {
      logger.debug('Executando refetch programado', {
        tags: ['commitments', 'data', 'refetch']
      });
      refetch();
    }, 60000); // Aumentado para 60 segundos
    
    return () => {
      logger.debug('Componente de compromissos desmontado', {
        tags: ['commitments', 'lifecycle']
      });
      clearInterval(intervalId);
    };
  }, [refetch, location.pathname]); // Removido dataUpdatedAt para evitar loop infinito
  
  // Debug effect to log reminders state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Estado dos lembretes atualizado', {
        tags: ['commitments', 'data'],
        count: reminders?.length || 0,
        isLoading,
        hasError: !!error,
        error: error?.message || null
      });
    }
  }, [reminders, isLoading, error]);
  
  // Handle date selection
  const handleSelectDate = (date: Date | undefined) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Data selecionada no calendário', {
        tags: ['commitments', 'ui', 'calendar'],
        selectedDate: date?.toISOString() || null
      });
    }
    setSelectedDate(date);
  };

  // Handle manual refresh with toast notification
  const handleManualRefresh = () => {
    toast({
      title: "Atualizando dados",
      description: "Buscando seus compromissos mais recentes..."
    });
    handleRefresh();
  };

  // Render the main content based on state
  const renderContent = () => {
    const isEmpty = reminders.length === 0;
    
    // Show loading/error/empty states
    if (isLoading || error || isEmpty) {
      return (
        <RemindersStatusDisplay
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty && !isLoading}
          onRefresh={handleManualRefresh}
        />
      );
    }
    
    // Show main reminders content
    return (
      <div>
        <RemindersHeader 
          isRefetching={isRefetching}
          onRefresh={handleManualRefresh}
          dataUpdatedAt={dataUpdatedAt}
          remindersCount={reminders.length}
        />
        
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
          <SelectedDateReminders
            reminders={reminders}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
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
