
import React, { useEffect } from 'react';
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
  
  // Exibe os IDs dos reminders para debug
  useEffect(() => {
    if (reminders.length > 0) {
      console.log('RemindersCalendar - Exemplo de reminder carregado:', {
        id: reminders[0].id,
        client_id: reminders[0].client_id,
        data: reminders[0].lembrete_data,
        mensagem: reminders[0].mensagem_lembrete.substring(0, 30) + '...'
      });
      
      // Log client_ids para verificar se estão sendo carregados corretamente
      const uniqueClientIds = [...new Set(reminders.map(r => r.client_id))];
      console.log('RemindersCalendar - Client IDs únicos nos reminders:', uniqueClientIds);
      
      // Verificar se o client_id no localStorage corresponde aos reminders
      const localStorageClientId = localStorage.getItem('user_id');
      console.log('RemindersCalendar - localStorage client_id:', localStorageClientId);
      console.log('RemindersCalendar - Todos os reminders são do cliente atual:', 
        reminders.every(r => r.client_id === localStorageClientId));
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
  
  console.log('RemindersCalendar - Datas com lembretes:', Object.keys(remindersByDate).length);
  
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
