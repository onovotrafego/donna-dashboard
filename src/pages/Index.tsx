
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import BalanceCard from '@/components/dashboard/BalanceCard';
import StatisticsRow from '@/components/dashboard/StatisticsRow';
import TransactionList from '@/components/dashboard/TransactionList';
import { useQuery } from '@tanstack/react-query';
import { supabase, debugSupabaseQuery } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction } from '@/components/dashboard/TransactionList';
import { useToast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('[QUERY] No user, returning empty transactions');
        return [];
      }
      
      console.log('[QUERY] Fetching transactions for user:', user.id);
      
      const { data, error } = await debugSupabaseQuery(
        supabase
          .from('donna_lancamentos')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        'recent-transactions'
      );
        
      if (error) {
        console.error('[QUERY] Error fetching transactions:', error);
        toast({
          title: "Erro ao carregar transações",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('[QUERY] Transactions data:', data);
      
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

  if (error) {
    console.error('[INDEX] Error in transactions query:', error);
  }

  return (
    <MainLayout title="Minhas Finanças">
      <div className="max-w-md mx-auto">
        <BalanceCard />
        <StatisticsRow />
        <TransactionList 
          limit={5} 
          isLoading={isLoading} 
          transactions={transactions} 
          error={error ? String(error) : undefined}
        />
      </div>
    </MainLayout>
  );
};

export default Index;
