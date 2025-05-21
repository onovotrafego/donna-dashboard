
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { CalendarIcon, Thermometer } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/components/dashboard/TransactionList';

interface TransactionHeatMapProps {
  transactions: Transaction[];
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
}

interface DaySpending {
  date: Date;
  total: number;
}

const TransactionHeatMap: React.FC<TransactionHeatMapProps> = ({ 
  transactions, 
  onSelectDate,
  selectedDate 
}) => {
  // Group transactions by day and calculate the total spending for each day
  const getDailySpending = (): DaySpending[] => {
    const spending = new Map<string, DaySpending>();
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const date = new Date(transaction.date);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (spending.has(dateKey)) {
          const existing = spending.get(dateKey)!;
          existing.total += transaction.amount;
        } else {
          spending.set(dateKey, {
            date: date,
            total: transaction.amount
          });
        }
      }
    });
    
    return Array.from(spending.values());
  };
  
  const dailySpending = getDailySpending();
  
  // Find the maximum spending in a day to normalize the heat scale
  const maxSpending = dailySpending.length > 0 
    ? Math.max(...dailySpending.map(day => day.total)) 
    : 0;
  
  // Get spending level for the day (0 to 4, with 4 being the highest)
  const getSpendingLevel = (date: Date): number => {
    const daySpending = dailySpending.find(day => isSameDay(day.date, date));
    
    if (!daySpending) return 0;
    
    // Calculate spending level (0 to 4)
    if (maxSpending === 0) return 0;
    const percentage = daySpending.total / maxSpending;
    
    if (percentage >= 0.8) return 4; // 80-100% - Extreme (red)
    if (percentage >= 0.6) return 3; // 60-80% - High (purple)
    if (percentage >= 0.4) return 2; // 40-60% - Medium (orange)
    if (percentage >= 0.2) return 1; // 20-40% - Low (yellow)
    return 0; // 0-20% - Very low (green)
  };
  
  // Custom day renderer for the calendar
  const renderDay = (day: Date, modifiers: any): React.ReactNode => {
    const level = getSpendingLevel(day);
    const spendingDay = dailySpending.find(spending => isSameDay(spending.date, day));
    const amount = spendingDay?.total ?? 0;
    
    // Define class based on spending level
    const levelClass = [
      'bg-opacity-20 bg-green-500', // Very low - green
      'bg-opacity-30 bg-yellow-400', // Low - yellow
      'bg-opacity-40 bg-orange-500', // Medium - orange
      'bg-opacity-50 bg-purple-600', // High - purple
      'bg-opacity-70 bg-red-500', // Extreme - red
    ][level];
    
    // Add a special indicator for the day with max spending
    const isMaxSpendingDay = maxSpending > 0 && amount === maxSpending;
    
    return (
      <div 
        className={cn(
          "w-full h-full flex items-center justify-center relative",
          amount > 0 && levelClass,
          isMaxSpendingDay && "ring-2 ring-red-500",
          selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-primary"
        )}
        title={amount > 0 ? `R$ ${amount.toFixed(2)}` : undefined}
      >
        {day.getDate()}
        {isMaxSpendingDay && (
          <Thermometer 
            size={12} 
            className="absolute top-0 right-0 text-red-500 bg-white rounded-full" 
          />
        )}
      </div>
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Termômetro de gastos</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon size={16} className="mr-2" />
              Ver calendário
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                components={{
                  Day: ({ date, ...props }) => renderDay(date, props)
                }}
                className="pointer-events-auto"
              />
              
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium mb-1">Legenda:</div>
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 bg-opacity-20 rounded-sm mr-1"></div>
                    <span className="text-xs">Baixo</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 bg-opacity-30 rounded-sm mr-1"></div>
                    <span className="text-xs">Médio</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 bg-opacity-40 rounded-sm mr-1"></div>
                    <span className="text-xs">Alto</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 bg-opacity-50 rounded-sm mr-1"></div>
                    <span className="text-xs">Muito alto</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 bg-opacity-70 rounded-sm mr-1"></div>
                    <span className="text-xs">Extremo</span>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Mini visualization showing days with spending */}
      <div className="flex justify-between bg-muted/20 p-2 rounded-lg">
        {dailySpending.slice(0, 7).map((day, index) => {
          const level = getSpendingLevel(day.date);
          const levelClass = [
            'bg-green-500', // Very low
            'bg-yellow-400', // Low
            'bg-orange-500', // Medium
            'bg-purple-600', // High
            'bg-red-500', // Extreme
          ][level];
          
          const heightPercentage = maxSpending > 0 
            ? Math.max(20, (day.total / maxSpending) * 100) 
            : 20;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`w-6 rounded-t-sm ${levelClass}`} 
                style={{ height: `${heightPercentage}%`, minHeight: '20px' }}
                title={`R$ ${day.total.toFixed(2)}`}
              ></div>
              <div className="text-xs mt-1">{format(day.date, 'dd')}</div>
            </div>
          );
        })}
        {dailySpending.length === 0 && (
          <div className="text-xs text-muted-foreground text-center w-full py-2">
            Nenhum gasto registrado no período
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHeatMap;
