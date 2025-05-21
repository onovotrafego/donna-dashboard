
import React from 'react';
import { format, isSameDay, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Reminder } from '@/types/reminder';

interface WeeklyRemindersHighlightProps {
  reminders: Reminder[];
  onSelectDate: (date: Date) => void;
}

const WeeklyRemindersHighlight: React.FC<WeeklyRemindersHighlightProps> = ({ reminders, onSelectDate }) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira como início da semana
  
  // Gerar os dias da semana atual
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayReminders = reminders.filter(reminder => {
      const reminderDate = new Date(reminder.lembrete_data);
      return isSameDay(reminderDate, date);
    });
    
    return {
      date,
      dayName: format(date, 'EEE', { locale: ptBR }),
      dayNumber: format(date, 'd'),
      isToday: isSameDay(date, today),
      reminders: dayReminders,
      hasReminders: dayReminders.length > 0
    };
  });
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Compromissos desta semana</h3>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div 
            key={day.date.toString()} 
            className={`
              text-center py-2 rounded-md cursor-pointer
              ${day.isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
              ${day.hasReminders ? 'ring-1 ring-primary/30' : ''}
            `}
            onClick={() => onSelectDate(day.date)}
          >
            <div className="text-xs font-medium">{day.dayName}</div>
            <div className="text-sm font-bold">{day.dayNumber}</div>
            {day.hasReminders && (
              <div className="mt-1 flex justify-center">
                <Badge variant="outline" className="text-xs h-4 min-w-4 px-1">
                  {day.reminders.length}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyRemindersHighlight;
