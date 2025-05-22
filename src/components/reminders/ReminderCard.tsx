
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Repeat, DollarSign, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Reminder } from '@/types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder }) => {
  // Corrigindo o problema de fuso horário ao converter a data
  // Formato da data no banco: "YYYY-MM-DD"
  const [year, month, day] = reminder.lembrete_data.split('-').map(Number);
  const reminderDate = new Date(year, month - 1, day);
  const formattedDate = format(reminderDate, 'PP', { locale: ptBR });
  
  return (
    <Card className={`mb-3 ${reminder.is_enviado ? 'bg-muted/50' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <div className="font-medium">{reminder.mensagem_lembrete}</div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Calendar size={14} className="mr-1" />
              <span>{formattedDate}</span>
              
              {reminder.recorrencia && (
                <span className="flex items-center ml-3">
                  <Repeat size={14} className="mr-1 text-primary" />
                  <span>Recorrente</span>
                </span>
              )}
            </div>
            
            {reminder.valor && (
              <div className="mt-2 flex items-center font-medium">
                <DollarSign size={14} className="mr-1" />
                <span>R$ {reminder.valor}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center
              ${reminder.is_enviado 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'}
            `}>
              <Check size={14} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;
