
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isSameDay } from 'date-fns';
import ReminderCard from './ReminderCard';
import type { Reminder } from '@/types/reminder';

interface SelectedDateRemindersProps {
  reminders: Reminder[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}

const SelectedDateReminders: React.FC<SelectedDateRemindersProps> = ({
  reminders,
  selectedDate,
  setSelectedDate
}) => {
  if (!selectedDate) return null;
  
  // Filtra os lembretes pela data selecionada
  const selectedDateReminders = reminders.filter(reminder => {
    // Corrigindo o problema de fuso horário ao converter a data
    const [year, month, day] = reminder.lembrete_data.split('-').map(Number);
    const reminderDate = new Date(year, month - 1, day);
    return isSameDay(reminderDate, selectedDate);
  });
  
  return (
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
  );
};

export default SelectedDateReminders;
