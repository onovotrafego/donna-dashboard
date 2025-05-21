
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import WeeklyRemindersHighlight from '@/components/reminders/WeeklyRemindersHighlight';
import RemindersCalendar from '@/components/reminders/RemindersCalendar';
import ReminderCard from '@/components/reminders/ReminderCard';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Reminder } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';

const CommitmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log('CommitmentsPage - Auth context user:', user);
    console.log('CommitmentsPage - Local storage user ID:', localStorage.getItem('user_id'));
    
    // Verify the Supabase auth session
    supabase.auth.getSession().then(({ data }) => {
      console.log('CommitmentsPage - Supabase session user:', data.session?.user);
    });
  }, [user]);
  
  // Buscar os lembretes do usuário
  const { data: reminders = [], isLoading, error } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('CommitmentsPage - No user ID available, cannot fetch reminders');
        return [];
      }
      
      console.log('CommitmentsPage - Fetching reminders for user ID:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('donna_lembretes')
          .select('*')
          .eq('client_id', user.id);
          
        if (error) {
          console.error('CommitmentsPage - Error fetching reminders:', error);
          toast({
            title: "Erro ao carregar compromissos",
            description: "Não foi possível carregar seus compromissos. Tente novamente.",
            variant: "destructive"
          });
          throw error;
        }
        
        console.log('CommitmentsPage - Reminders fetched successfully:', data?.length || 0);
        console.log('CommitmentsPage - Raw reminder data:', data);
        return data as Reminder[];
      } catch (e) {
        console.error('CommitmentsPage - Exception during fetch:', e);
        throw e;
      }
    },
    enabled: !!user?.id,
    retry: 1
  });
  
  // Filtra os lembretes pela data selecionada
  const selectedDateReminders = selectedDate 
    ? reminders.filter(reminder => {
        const reminderDate = new Date(reminder.lembrete_data);
        const result = isSameDay(reminderDate, selectedDate);
        
        // Log for debugging filtered reminders
        console.log(`CommitmentsPage - Checking reminder date: ${reminder.lembrete_data} against selected: ${selectedDate.toISOString()} - match: ${result}`);
        
        return result;
      })
    : [];
  
  useEffect(() => {
    if (selectedDate) {
      console.log('CommitmentsPage - Selected date reminders:', selectedDateReminders);
    }
  }, [selectedDate, selectedDateReminders]);
  
  // Manipula a seleção de data
  const handleSelectDate = (date: Date | undefined) => {
    console.log('CommitmentsPage - Date selected:', date);
    setSelectedDate(date);
  };

  // Renderiza o conteúdo da página
  const renderContent = () => {
    if (isLoading) {
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
        </Card>
      );
    }
    
    return (
      <div>
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
