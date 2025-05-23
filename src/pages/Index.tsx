
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
import { parseBrazilianCurrency } from '@/utils/currency';
import { logger, LogData } from '@/utils/security/secureLogger';

const getObfuscatedId = (id: string | null | undefined): string => {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***' + id.slice(-4);
  return id.slice(0, 4) + '...' + id.slice(-4);
};

const Index: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async () => {
      if (!user) {
        logger.debug('Nenhum usuário autenticado, retornando transações vazias', {
          tags: ['transactions', 'query', 'auth']
        });
        return [];
      }
      
      const obfuscatedId = getObfuscatedId(user.id);
      logger.debug('Buscando transações recentes', {
        userId: obfuscatedId,
        table: 'donna_lancamentos',
        limit: 5,
        tags: ['transactions', 'query']
      });
      
      const queryName = 'recent-transactions';
      const { data, error } = await debugSupabaseQuery(
        supabase
          .from('donna_lancamentos')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        queryName
      );
        
      if (error) {
        const errorMessage = `Erro ao buscar transações: ${error.message}`;
        logger.error(errorMessage, new Error(errorMessage), {
          tags: ['transactions', 'query', 'error'],
          query: queryName,
          userId: obfuscatedId
        });
        
        toast({
          title: "Erro ao carregar transações",
          description: "Ocorreu um erro ao buscar suas transações recentes. Por favor, tente novamente.",
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Transações encontradas: ${data.length}`, {
          count: data.length,
          userId: obfuscatedId,
          tags: ['transactions', 'query', 'debug']
        });
      }
      
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
