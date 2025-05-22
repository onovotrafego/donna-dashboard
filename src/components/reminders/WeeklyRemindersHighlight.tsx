
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
      // Corrigindo o problema de fuso horário ao converter a data
      const [year, month, day] = reminder.lembrete_data.split('-').map(Number);
      const reminderDate = new Date(year, month - 1, day);
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
  
  // Filtrar apenas os dias que têm lembretes
  const daysWithReminders = weekDays.filter(day => day.hasReminders);
  
  // Se não houver lembretes na semana, exibir mensagem
  if (daysWithReminders.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Compromissos desta semana</h3>
        <div className="text-center py-4 text-muted-foreground text-sm">
          Nenhum compromisso agendado para esta semana.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Próximos compromissos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {daysWithReminders.map((day) => {
          // Encontrar o lembrete mais próximo do dia atual
          const nextReminder = day.reminders[0];
          const [year, month, dayOfMonth] = nextReminder.lembrete_data.split('-').map(Number);
          const reminderDate = new Date(year, month - 1, dayOfMonth);
          const formattedDate = format(reminderDate, "EEEE, d 'de' MMMM", { locale: ptBR });
          
          return (
            <div 
              key={day.date.toString()}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${day.isToday ? 'bg-primary/5 border-primary/30' : 'border-border hover:border-primary/50'}
              `}
              onClick={() => onSelectDate(day.date)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                  </div>
                  {nextReminder.mensagem_lembrete && (
                    <div className="font-medium mt-1">
                      {nextReminder.mensagem_lembrete}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <Badge 
                    variant={day.isToday ? 'default' : 'outline'} 
                    className="h-7 w-7 flex items-center justify-center rounded-full p-0 text-sm"
                  >
                    {day.dayNumber}
                  </Badge>
                  {day.reminders.length > 1 && (
                    <span className="text-xs text-muted-foreground mt-1">
                      +{day.reminders.length - 1} {day.reminders.length === 2 ? 'outro' : 'outros'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyRemindersHighlight;
