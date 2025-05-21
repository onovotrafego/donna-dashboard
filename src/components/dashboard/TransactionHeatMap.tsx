
import React, { useState } from 'react';
import { format, parseISO, isSameDay, isSameMonth, eachDayOfInterval, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from './TransactionList';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

interface TransactionHeatMapProps {
  transactions: Transaction[];
  onSelectDate: (date: Date | undefined) => void;
  selectedDate?: Date;
}

interface DailySpending {
  date: Date;
  totalSpent: number;
  transactions: Transaction[];
}

const TransactionHeatMap: React.FC<TransactionHeatMapProps> = ({ 
  transactions, 
  onSelectDate,
  selectedDate 
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Agrupa transações por data e calcula o total gasto em cada dia
  const dailySpending: Record<string, DailySpending> = {};
  
  transactions.forEach(transaction => {
    const date = parseISO(transaction.date);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!dailySpending[dateKey]) {
      dailySpending[dateKey] = {
        date,
        totalSpent: 0,
        transactions: []
      };
    }
    
    // Adiciona ao total apenas se for despesa
    if (transaction.type === 'expense') {
      dailySpending[dateKey].totalSpent += transaction.amount;
    }
    
    dailySpending[dateKey].transactions.push(transaction);
  });
  
  // Encontra o valor máximo gasto em um único dia para normalizar a escala
  const maxDailySpending = Math.max(
    1, // Evita divisão por zero
    ...Object.values(dailySpending).map(day => day.totalSpent)
  );
  
  // Função para renderizar o conteúdo personalizado de cada dia
  const renderDayContent = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailySpending[dateKey];
    
    if (!dayData || dayData.totalSpent === 0) return null;
    
    // Calcular a intensidade da cor com base nos gastos (0 a 100%)
    const intensity = (dayData.totalSpent / maxDailySpending) * 100;
    
    // Aplicar uma classe de cor com base na intensidade
    let sizeClass;
    if (intensity > 80) sizeClass = "w-5 h-5";
    else if (intensity > 50) sizeClass = "w-4 h-4";
    else if (intensity > 20) sizeClass = "w-3 h-3";
    else sizeClass = "w-2 h-2";
    
    return (
      <div className="flex justify-center mt-1">
        <div 
          className={`${sizeClass} rounded-full bg-finance-alert`} 
          style={{ 
            opacity: 0.3 + (intensity / 100) * 0.7 // Varia de 0.3 a 1.0
          }}
        ></div>
      </div>
    );
  };
  
  // Componente personalizado para o conteúdo do dia
  const DayContent = ({ day }: { day: Date }) => (
    <>
      {day.getDate()}
      {renderDayContent(day)}
    </>
  );

  return (
    <Card className="p-1 mb-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        locale={ptBR}
        showOutsideDays={true}
        components={{
          DayContent
        }}
        className="rounded-md border"
      />
    </Card>
  );
};

export default TransactionHeatMap;
