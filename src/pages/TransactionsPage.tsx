
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isWithinInterval, parseISO } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import TransactionList from '@/components/dashboard/TransactionList';
import DateRangeFilter, { DateRange } from '@/components/dashboard/DateRangeFilter';
import TransactionHeatMap from '@/components/dashboard/TransactionHeatMap';
import ExportButton from '@/components/export/ExportButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { parseBrazilianCurrency } from '@/utils/currency';

const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date() // Today
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('donna_lancamentos')
        .select('*')
        .eq('client_id', user.id);
        
      if (error) throw error;
      
      // Transform data to match our application's format
      return data.map((item: any) => {
        // Explicitly map the natureza value to the correct transaction type
        let transactionType: 'income' | 'expense';
        if (item.natureza === 'ENTRADA') {
          transactionType = 'income';
        } else if (item.natureza === 'DESPESA' || item.natureza === 'SAÍDA') {
          transactionType = 'expense';
        } else {
          // Default fallback
          transactionType = 'expense';
        }
        
        return {
          id: item.id,
          title: item.descricao || 'Sem descrição',
          category: item.classificacao || 'Não classificado',
          amount: parseBrazilianCurrency(item.valor) || 0,
          date: item.created_at,
          type: transactionType
        };
      });
    },
    enabled: !!user
  });

  // Filter transactions by the selected date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = parseISO(transaction.date);
    return isWithinInterval(transactionDate, {
      start: dateRange.from,
      end: dateRange.to
    });
  });

  // Further filter by selected date if one is selected
  const dateFilteredTransactions = selectedDate 
    ? filteredTransactions.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        return format(transactionDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      })
    : filteredTransactions;

  // Update the date range
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setSelectedDate(undefined); // Clear selected date when range changes
  };

  // Select a specific date
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Get total spending for the filtered transactions
  const totalSpending = dateFilteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get total income for the filtered transactions
  const totalIncome = dateFilteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout title="Minhas Transações">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filtrar transações</h2>
          <ExportButton 
            transactions={dateFilteredTransactions}
            dateRange={dateRange}
            userName={user?.name} // Changed from nome to name to match User type
            disabled={isLoading || dateFilteredTransactions.length === 0}
          />
        </div>
        
        <DateRangeFilter onRangeChange={handleDateRangeChange} />
        
        {/* Display summary statistics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">Total de gastos</div>
            <div className="text-lg font-semibold text-finance-alert">
              R$ {totalSpending.toFixed(2)}
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">Total de entradas</div>
            <div className="text-lg font-semibold text-finance-secondary">
              R$ {totalIncome.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Display heat map */}
        <TransactionHeatMap 
          transactions={filteredTransactions} 
          onSelectDate={handleSelectDate} 
          selectedDate={selectedDate}
        />
        
        {selectedDate && (
          <div className="mb-4 bg-muted/20 p-2 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Transações em {format(selectedDate, 'dd/MM/yyyy')}
              </span>
              <button 
                onClick={() => setSelectedDate(undefined)}
                className="text-xs text-primary"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        )}
        
        <TransactionList 
          showViewAll={false} 
          isLoading={isLoading} 
          transactions={dateFilteredTransactions} 
          error={error?.message}
        />
      </div>
    </MainLayout>
  );
};

export default TransactionsPage;
