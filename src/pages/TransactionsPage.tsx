
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import TransactionList from '@/components/dashboard/TransactionList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { parseBrazilianCurrency } from '@/utils/currency';

const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  
  const { data: transactions, isLoading, error } = useQuery({
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

  return (
    <MainLayout title="Minhas Transações">
      <div className="max-w-md mx-auto">
        <TransactionList 
          showViewAll={false} 
          isLoading={isLoading} 
          transactions={transactions} 
        />
      </div>
    </MainLayout>
  );
};

export default TransactionsPage;
