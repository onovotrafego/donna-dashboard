
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import type { Reminder } from '@/types/reminder';

interface RemindersCalendarProps {
  reminders: Reminder[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

const RemindersCalendar: React.FC<RemindersCalendarProps> = ({ 
  reminders, 
  selectedDate,
  onSelectDate 
}) => {
  console.log('RemindersCalendar - Rendering with reminders count:', reminders.length);
  
  // Agrupa lembretes por data (formato YYYY-MM-DD)
  const remindersByDate: Record<string, Reminder[]> = {};
  
  reminders.forEach(reminder => {
    try {
      const reminderDate = new Date(reminder.lembrete_data);
      if (isNaN(reminderDate.getTime())) {
        console.warn('RemindersCalendar - Invalid date in reminder:', reminder);
        return;
      }
      
      const dateKey = format(reminderDate, 'yyyy-MM-dd');
      
      if (!remindersByDate[dateKey]) {
        remindersByDate[dateKey] = [];
      }
      remindersByDate[dateKey].push(reminder);
      
    } catch (error) {
      console.error('RemindersCalendar - Error processing reminder:', error, reminder);
    }
  });
  
  console.log('RemindersCalendar - Grouped reminders:', remindersByDate);
  
  // Encontra o dia com mais lembretes para escala visual
  const maxRemindersCount = Math.max(
    1, // Mínimo 1 para evitar divisão por zero
    ...Object.values(remindersByDate).map(dayReminders => dayReminders.length)
  );

  return (
    <div className="bg-background rounded-lg p-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        locale={ptBR}
        showOutsideDays={true}
        components={{
          DayContent: ({ date }) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayReminders = remindersByDate[dateKey] || [];
            
            return (
              <>
                {date.getDate()}
                {dayReminders.length > 0 && (
                  <div className="flex gap-1 justify-center mt-1">
                    {/* Indicador principal baseado na quantidade */}
                    <div 
                      className={`w-2 h-2 rounded-full ${dayReminders.some(reminder => reminder.recorrencia) ? 'bg-primary' : 'bg-secondary'}`}
                      style={{
                        opacity: 0.3 + ((dayReminders.length / maxRemindersCount) * 0.7) // Varia de 0.3 a 1.0
                      }}
                    />
                    
                    {/* Indicador adicional para lembretes com valor */}
                    {dayReminders.some(reminder => reminder.valor) && (
                      <div className="w-2 h-2 rounded-full bg-rose-500" style={{ opacity: 0.7 }} />
                    )}
                  </div>
                )}
              </>
            );
          }
        }}
        className="rounded-md border"
      />
    </div>
  );
};

export default RemindersCalendar;
