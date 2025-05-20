
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import TransactionList from '@/components/dashboard/TransactionList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

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
      return data.map((item: any) => ({
        id: item.id,
        title: item.descricao || 'Sem descrição',
        category: item.classificacao || 'Não classificado',
        amount: parseFloat(item.valor) || 0,
        date: item.created_at,
        type: item.natureza === 'ENTRADA' ? 'income' : 'expense'
      }));
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
