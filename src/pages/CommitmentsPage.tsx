
import React, { useState } from 'react';
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
import type { Reminder } from '@/types/reminder';

const CommitmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Buscar os lembretes do usuário
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('donna_lembretes')
        .select('*')
        .eq('client_id', user.id);
        
      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user
  });
  
  // Filtra os lembretes pela data selecionada
  const selectedDateReminders = selectedDate 
    ? reminders.filter(reminder => {
        const reminderDate = new Date(reminder.lembrete_data);
        return isSameDay(reminderDate, selectedDate);
      })
    : [];
  
  // Manipula a seleção de data
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <MainLayout title="Meus Compromissos">
      <div className="max-w-md mx-auto">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <p>Carregando compromissos...</p>
          </div>
        ) : reminders.length === 0 ? (
          <Card className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Nenhum compromisso encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não possui nenhum compromisso financeiro registrado.
            </p>
          </Card>
        ) : (
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
                  selectedDateReminders.map(reminder => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CommitmentsPage;
