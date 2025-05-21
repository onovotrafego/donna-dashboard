
import React, { useState } from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
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
  // Agrupa lembretes por data (formato YYYY-MM-DD)
  const remindersByDate = reminders.reduce((acc, reminder) => {
    const dateKey = format(new Date(reminder.lembrete_data), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(reminder);
    return acc;
  }, {} as Record<string, Reminder[]>);
  
  // Encontra o dia com mais lembretes para escala visual
  const maxRemindersCount = Math.max(
    1, // Mínimo 1 para evitar divisão por zero
    ...Object.values(remindersByDate).map(dayReminders => dayReminders.length)
  );
  
  // Renderiza um indicador visual para cada dia com lembretes
  const renderDayContent = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayReminders = remindersByDate[dateKey] || [];
    
    if (dayReminders.length === 0) return null;
    
    // Calcula intensidade com base na quantidade de lembretes
    const intensity = (dayReminders.length / maxRemindersCount) * 100;
    
    // Verifica se há lembretes recorrentes
    const hasRecurring = dayReminders.some(reminder => reminder.recorrencia);
    
    // Verifica se há lembretes com valor
    const hasValues = dayReminders.some(reminder => reminder.valor);
    
    return (
      <div className="flex gap-1 justify-center mt-1">
        {/* Indicador principal baseado na quantidade */}
        <div 
          className={`w-2 h-2 rounded-full ${hasRecurring ? 'bg-primary' : 'bg-secondary'}`}
          style={{
            opacity: 0.3 + (intensity / 100) * 0.7 // Varia de 0.3 a 1.0
          }}
        />
        
        {/* Indicador adicional para lembretes com valor */}
        {hasValues && (
          <div className="w-2 h-2 rounded-full bg-finance-alert" style={{ opacity: 0.7 }} />
        )}
      </div>
    );
  };

  return (
    <div className="bg-background rounded-lg p-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        locale={ptBR}
        showOutsideDays={true}
        components={{
          DayContent: ({ day }) => (
            <>
              {day.getDate()}
              {renderDayContent(day)}
            </>
          ),
        }}
        className="rounded-md border"
      />
    </div>
  );
};

export default RemindersCalendar;
