
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useReminders } from '@/hooks/reminders/useReminders';
import { verifyClientIds } from '@/utils/auth/searchUtils';

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
    console.log('[COMMITMENTS] Componente montado ou atualizado');
    console.log('[COMMITMENTS] Local storage user ID:', localStorage.getItem('user_id'));
    
    // Verify the client IDs for debugging
    verifyClientIds();
    
    // Force refetch when the component is mounted or the route changes
    const forceRefetch = async () => {
      console.log('[COMMITMENTS] Forçando refetch dos lembretes...');
      try {
        await refetch();
        console.log('[COMMITMENTS] Refetch concluído com sucesso');
        console.log('[COMMITMENTS] Última atualização:', new Date(dataUpdatedAt).toLocaleTimeString());
      } catch (err) {
        console.error('[COMMITMENTS] Erro durante o refetch:', err);
      }
    };
    
    // Executar o refetch apenas quando o componente é montado ou a rota muda
    forceRefetch();
    
    // Configurar um intervalo para refetch automático a cada 60 segundos (aumentado para reduzir a carga)
    const intervalId = setInterval(() => {
      console.log('[COMMITMENTS] Executando refetch programado');
      refetch();
    }, 60000); // Aumentado para 60 segundos
    
    return () => {
      clearInterval(intervalId);
      console.log('[COMMITMENTS] Componente desmontado');
    };
  }, [refetch, location.pathname]); // Removido dataUpdatedAt para evitar loop infinito
  
  // Log current state for debugging
  useEffect(() => {
    console.log('[COMMITMENTS] Estado atual dos lembretes:', { 
      count: reminders.length,
      isLoading,
      isRefetching,
      error: error ? 'Sim' : 'Não',
      dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString()
    });
  }, [reminders, isLoading, isRefetching, error, dataUpdatedAt]);
  
  // Handle date selection
  const handleSelectDate = (date: Date | undefined) => {
    console.log('[COMMITMENTS] Data selecionada:', date);
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
