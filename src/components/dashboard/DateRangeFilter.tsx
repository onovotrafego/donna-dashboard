
import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, CalendarRange } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarRange as CalendarRangeIcon, Filter } from 'lucide-react';

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
}

export interface DateRange {
  from: Date;
  to: Date;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onRangeChange }) => {
  const [dateRange, setDateRange] = useState<CalendarRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [isOpen, setIsOpen] = useState(false);
  
  const handleRangeSelect = (range: CalendarRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      onRangeChange({ from: range.from, to: range.to });
    }
  };
  
  const applyPresetRange = (preset: 'week' | 'month' | 'lastMonth') => {
    let from: Date, to: Date;
    
    switch (preset) {
      case 'week':
        from = startOfWeek(new Date(), { weekStartsOn: 1 });
        to = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'month':
        from = startOfMonth(new Date());
        to = new Date();
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(new Date(), 1));
        to = endOfMonth(subMonths(new Date(), 1));
        break;
    }
    
    const newRange = { from, to };
    setDateRange(newRange);
    onRangeChange(newRange);
    setIsOpen(false);
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyPresetRange('week')}
          >
            Esta semana
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyPresetRange('month')}
          >
            Este mês
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyPresetRange('lastMonth')}
          >
            Mês anterior
          </Button>
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Filter size={16} className="mr-2" />
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                </>
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleRangeSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangeFilter;
