
import React, { useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import type { Reminder } from '@/types/reminder';
import { logger } from '@/utils/security/secureLogger';

// Função para ofuscar IDs sensíveis
const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

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
  logger.debug('RemindersCalendar - Rendering', {
    count: reminders.length,
    tags: ['reminders', 'calendar']
  });
  
  // Verificação de dados de lembretes (apenas em desenvolvimento)
  useEffect(() => {
    if (reminders.length > 0 && process.env.NODE_ENV === 'development') {
      logger.debug('RemindersCalendar - Dados de lembretes', {
        count: reminders.length,
        hasData: true,
        tags: ['reminders', 'calendar']
      });
      
      // Verificar se o client_id no localStorage corresponde aos reminders
      const localStorageClientId = localStorage.getItem('user_id');
      const allRemindersMatchClient = reminders.every(r => r.client_id === localStorageClientId);
      
      if (!allRemindersMatchClient) {
        logger.warn('RemindersCalendar - Inconsistência de dados', {
          clientIdMatches: allRemindersMatchClient,
          tags: ['reminders', 'calendar', 'warning']
        });
      }
    }
  }, [reminders]);
  
  // Agrupa lembretes por data (formato YYYY-MM-DD)
  const remindersByDate: Record<string, Reminder[]> = {};
  
  reminders.forEach(reminder => {
    try {
      // Corrigindo o problema de fuso horário ao converter a data
      const [year, month, day] = reminder.lembrete_data.split('-').map(Number);
      const reminderDate = new Date(year, month - 1, day);
      if (isNaN(reminderDate.getTime())) {
        logger.warn('RemindersCalendar - Invalid date in reminder', {
          reminderId: reminder.id,
          date: reminder.lembrete_data,
          tags: ['reminders', 'calendar', 'warning']
        });
        return;
      }
      
      const dateKey = format(reminderDate, 'yyyy-MM-dd');
      
      if (!remindersByDate[dateKey]) {
        remindersByDate[dateKey] = [];
      }
      remindersByDate[dateKey].push(reminder);
      
    } catch (error) {
      logger.error('RemindersCalendar - Error processing reminder', error as Error, {
        reminderId: reminder.id,
        date: reminder.lembrete_data,
        tags: ['reminders', 'calendar', 'error']
      });
    }
  });
  
  logger.debug('RemindersCalendar - Processamento concluído', {
    datesWithReminders: Object.keys(remindersByDate).length,
    tags: ['reminders', 'calendar']
  });
  
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
            
            // Determina as classes para o círculo de fundo quando há lembretes
            const hasReminders = dayReminders.length > 0;
            const hasValueReminders = dayReminders.some(reminder => reminder.valor);
            const hasRecurringReminders = dayReminders.some(reminder => reminder.recorrencia);
            
            // Determina a cor do círculo de fundo
            let bgColorClass = '';
            if (hasValueReminders) {
              bgColorClass = 'bg-rose-500/10'; // Lembretes com valor têm prioridade visual
            } else if (hasRecurringReminders) {
              bgColorClass = 'bg-primary/10';
            } else if (hasReminders) {
              bgColorClass = 'bg-secondary/10';
            }
            
            return (
              <div className="relative flex items-center justify-center">
                {/* Círculo de fundo para dias com lembretes */}
                {hasReminders && (
                  <div 
                    className={`absolute inset-0 rounded-full ${bgColorClass}`}
                    style={{
                      opacity: 0.5 + ((dayReminders.length / maxRemindersCount) * 0.5) // Varia de 0.5 a 1.0
                    }}
                  />
                )}
                
                {/* Número do dia */}
                <span className={`${hasReminders ? 'relative z-10' : ''}`}>
                  {date.getDate()}
                </span>
                
                {/* Indicadores abaixo do número, mais compactos */}
                {hasReminders && (
                  <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-0.5">
                    {hasRecurringReminders && (
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    )}
                    {hasValueReminders && (
                      <div className="w-1 h-1 rounded-full bg-rose-500" />
                    )}
                  </div>
                )}
              </div>
            );
          }
        }}
        className="rounded-md border"
      />
    </div>
  );
};

export default RemindersCalendar;
