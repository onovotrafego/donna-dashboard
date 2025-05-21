
import React, { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { parseBrazilianCurrency } from '@/utils/currency';

interface StatisticProps {
  label: string;
  value: number;
  type: 'income' | 'expense' | 'savings';
  isLoading?: boolean;
}

const Statistic: React.FC<StatisticProps> = ({ label, value, type, isLoading = false }) => {
  const icons = {
    income: <ArrowUpCircle className="text-finance-secondary" size={20} />,
    expense: <ArrowDownCircle className="text-finance-alert" size={20} />,
    savings: <Wallet className="text-finance-primary" size={20} />
  };
  
  if (isLoading) {
    return (
      <div className="financial-card flex-1 animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-5 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
        <div className="h-6 bg-muted rounded w-20 mt-2"></div>
      </div>
    );
  }
  
  return (
    <div className="financial-card flex-1">
      <div className="flex items-center gap-2 mb-1">
        {icons[type]}
        <p className="statistic-label">{label}</p>
      </div>
      <p className="statistic-value">
        {new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          maximumFractionDigits: 0
        }).format(value)}
      </p>
    </div>
  );
};

const StatisticsRow: React.FC = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState([
    { label: 'Entradas', value: 0, type: 'income' as const },
    { label: 'Saídas', value: 0, type: 'expense' as const },
    { label: 'Economia', value: 0, type: 'savings' as const }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user) return;
      
      try {
        // Get incoming transactions (ENTRADA)
        const { data: incomes, error: incomeError } = await supabase
          .from('donna_lancamentos')
          .select('valor')
          .eq('client_id', user.id)
          .eq('natureza', 'ENTRADA');
        
        if (incomeError) throw incomeError;
        
        // Get outgoing transactions (DESPESA)
        const { data: expenses, error: expenseError } = await supabase
          .from('donna_lancamentos')
          .select('valor')
          .eq('client_id', user.id)
          .or('natureza.eq.DESPESA,natureza.eq.SAÍDA');
        
        if (expenseError) throw expenseError;
        
        // Calculate total income
        const totalIncome = incomes.reduce((sum, item) => {
          const value = parseBrazilianCurrency(item.valor);
          return sum + value;
        }, 0);
        
        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, item) => {
          const value = parseBrazilianCurrency(item.valor);
          return sum + value;
        }, 0);
        
        // Calculate savings
        const savings = totalIncome - totalExpenses;
        
        setStatistics([
          { label: 'Entradas', value: totalIncome, type: 'income' as const },
          { label: 'Saídas', value: totalExpenses, type: 'expense' as const },
          { label: 'Economia', value: savings, type: 'savings' as const }
        ]);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [user]);
  
  return (
    <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
      {statistics.map((stat, index) => (
        <Statistic 
          key={index} 
          label={stat.label} 
          value={stat.value} 
          type={stat.type} 
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default StatisticsRow;
