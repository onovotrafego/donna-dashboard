
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import BalanceCard from '@/components/dashboard/BalanceCard';
import StatisticsRow from '@/components/dashboard/StatisticsRow';
import TransactionList from '@/components/dashboard/TransactionList';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction } from '@/components/dashboard/TransactionList';

const Index: React.FC = () => {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('donna_lancamentos')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
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
          amount: parseFloat(item.valor) || 0,
          date: item.created_at,
          type: transactionType
        };
      });
    },
    enabled: !!user
  });

  return (
    <MainLayout title="Minhas Finanças">
      <div className="max-w-md mx-auto">
        <BalanceCard />
        <StatisticsRow />
        <TransactionList 
          limit={5} 
          isLoading={isLoading} 
          transactions={transactions} 
        />
      </div>
    </MainLayout>
  );
};

export default Index;
