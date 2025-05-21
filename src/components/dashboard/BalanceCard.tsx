
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { parseBrazilianCurrency } from '@/utils/currency';

interface BalanceCardProps {
  balance?: number;
  change?: number;
  period?: string;
  isLoading?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance: propBalance, 
  change: propChange, 
  period = 'este mês',
  isLoading: propLoading
}) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(propBalance || 0);
  const [change, setChange] = useState(propChange || 0);
  const [isLoading, setIsLoading] = useState(propLoading || false);
  
  useEffect(() => {
    if (propBalance !== undefined) {
      setBalance(propBalance);
      return;
    }
    
    const fetchBalance = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Get incoming transactions (ENTRADA)
        const { data: incomes, error: incomeError } = await supabase
          .from('donna_lancamentos')
          .select('valor')
          .eq('client_id', user.id)
          .eq('natureza', 'ENTRADA');
        
        if (incomeError) throw incomeError;
        
        // Get outgoing transactions (DESPESA or SAÍDA)
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
        
        // Calculate balance
        const calculatedBalance = totalIncome - totalExpenses;
        setBalance(calculatedBalance);
        
        // Calculate change (simplified)
        const changePercentage = totalIncome > 0 ? 
          ((calculatedBalance / totalIncome) * 100) : 0;
        setChange(parseFloat(changePercentage.toFixed(1)));
        
      } catch (error) {
        console.error('Error fetching balance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBalance();
  }, [user, propBalance]);
  
  const isPositive = change >= 0;
  
  if (isLoading) {
    return (
      <div className="financial-card mb-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="h-5 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
          <div className="h-10 w-10 bg-muted rounded-full"></div>
        </div>
        <div className="h-5 bg-muted rounded w-16 mt-2"></div>
      </div>
    );
  }
  
  return (
    <div className="financial-card mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="statistic-label">Saldo atual</p>
          <h2 className="text-2xl font-bold font-poppins">
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(balance)}
          </h2>
        </div>
        
        <div className={`flex items-center p-2 rounded-full ${isPositive ? 'bg-finance-secondary/20 text-finance-secondary' : 'bg-finance-alert/20 text-finance-alert'}`}>
          {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
      </div>
      
      <div className="flex items-center mt-2">
        <span className={isPositive ? 'text-finance-secondary' : 'text-finance-alert'}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {period}
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;
